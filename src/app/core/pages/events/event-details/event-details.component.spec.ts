import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { PricingService } from 'src/app/core/store/services/pricing.service';
import { EventDetailsComponent } from './event-details.component';

// CHARACTERIZATION TESTS, written before the event-pricing cutover
// (Campaign Manager v3 stage 6) so the change has something to change
// AGAINST. This file had no spec at all, and it is the screen that decides
// what someone pays to register.
//
// The behaviour being pinned is deliberately the CURRENT behaviour, quirks
// included - most importantly that the displayed total is computed straight
// from costInDollars and never consults salePrice or PricingService, which is
// exactly the gap early-bird pricing walks into.
//
// Hand-constructed, house style: only FormBuilder is real, ngOnInit is never
// called, so none of the duck-typed services are touched.

function buildComponent(): EventDetailsComponent {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return new EventDetailsComponent(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    // PricingService is REAL here - it is the thing under test now.
    new PricingService() as any,
    // Offer + attribution: early-bird lookup, exercised in its own block below.
    { getActiveOffers: () => Promise.resolve([]) } as any,
    { get: () => null } as any,
    {} as any,
    {} as any,
    {} as any,
    new FormBuilder(),
    {} as any
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

function withEvent(costInDollars: number | undefined, attendees = 1): EventDetailsComponent {
  const component = buildComponent();
  component.event = { id: 'e1', eventName: 'Summit', costInDollars } as EventModel;
  component.cartItem = {
    id: 'e1',
    itemName: 'Summit',
    orderQuantity: attendees,
    price: costInDollars ?? 0,
    isEvent: true,
    attendees: Array.from({ length: attendees }, () => ({ firstName: '', lastName: '', email: '' }))
  } as never;
  component.attendeesForm = new FormBuilder().array(
    Array.from({ length: attendees }, () => new FormBuilder().group({}))
  );
  return component;
}

describe('EventDetailsComponent pricing (characterization)', () => {
  describe('calculateTotal', () => {
    it('multiplies the event cost by the attendee count', () => {
      const component = withEvent(25, 3);

      component.calculateTotal();

      expect(component.total).toBe(75);
    });

    it('leaves the total at zero for a free event', () => {
      const component = withEvent(0, 2);

      component.calculateTotal();

      expect(component.total).toBe(0);
    });

    it('totals a costless event at zero, not at whatever was there before', () => {
      // CHANGED deliberately in stage 6. The old guard only recomputed when
      // costInDollars was truthy, so a missing cost left a stale total on
      // screen. Pricing through PricingService means no cost is free.
      const component = withEvent(undefined, 2);
      component.total = 99;

      component.calculateTotal();

      expect(component.total).toBe(0);
    });

    it('honours a discounted registration price, as checkout already did', () => {
      // THE GAP, now closed. This screen used to show 100 while checkout
      // charged 79 for the very same cart item.
      const component = withEvent(100, 1);
      (component.cartItem as { salePrice?: number }).salePrice = 79;

      component.calculateTotal();

      expect(component.total).toBe(79);
    });
  });

  describe('attendee count', () => {
    it('adds an attendee and re-totals', () => {
      const component = withEvent(25, 1);

      component.increment();

      expect(component.cartItem.attendees?.length).toBe(2);
      expect(component.cartItem.orderQuantity).toBe(2);
      expect(component.total).toBe(50);
    });

    it('removes an attendee and re-totals', () => {
      const component = withEvent(25, 3);

      component.decrement();

      expect(component.cartItem.orderQuantity).toBe(2);
      expect(component.total).toBe(50);
    });

    it('never drops below one attendee', () => {
      const component = withEvent(25, 1);

      component.decrement();

      expect(component.cartItem.orderQuantity).toBe(1);
    });
  });

  describe('toggleAttendee', () => {
    it('opens and closes a section', () => {
      const component = withEvent(25, 2);

      component.toggleAttendee(1);
      expect(component.openIndexes.has(1)).toBeTrue();

      component.toggleAttendee(1);
      expect(component.openIndexes.has(1)).toBeFalse();
    });

    it('starts with the first attendee open', () => {
      expect(buildComponent().openIndexes.has(0)).toBeTrue();
    });
  });
});

// ---------------------------------------------------------------------------
// The live-stream rebuild
//
// ngOnInit subscribes to a LIVE Firestore listener (eventService.streamById)
// and, until 2026-08-26, rebuilt cartItem and attendeesForm from scratch on
// EVERY emission. So any later change to the event document - staff editing it,
// any trigger touching it - silently discarded whatever the visitor had typed
// into the attendee form, and reset their attendee count back to one.
//
// The failure is invisible where it happens: the fields simply empty, and the
// next click on "Sign UP" does nothing because the form is now invalid. It was
// found from an e2e failure snapshot (e2e-cross/02-summit-registration), where
// all three fields were blank with all three "is required" errors showing.
//
// These drive ngOnInit through a Subject so a second emission can be delivered
// on demand.
// ---------------------------------------------------------------------------

function buildStreamedComponent(stream: Subject<EventModel[]>): EventDetailsComponent {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return new EventDetailsComponent(
    { snapshot: { paramMap: { get: () => 'e1' } } } as any,
    { navigate: () => undefined } as any,
    { streamById: () => stream.asObservable() } as any,
    {} as any,
    new PricingService() as any,
    { getActiveOffers: () => Promise.resolve([]) } as any,
    { get: () => null } as any,
    // eventRegistrationService: the email control carries an async
    // "already registered" validator, so patchValue() below reaches it.
    { isAlreadyRegistered: () => Promise.resolve(false) } as any,
    {} as any,
    {} as any,
    new FormBuilder(),
    // DestroyRef is only ever handed to takeUntilDestroyed, which just
    // registers a teardown callback - a duck-typed onDestroy is enough, and
    // keeps this out of an injection context like the rest of the file.
    { onDestroy: () => () => undefined } as any
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const eventDoc = (overrides: Partial<EventModel> = {}): EventModel => ({
  id: 'e1',
  eventName: 'Summit',
  costInDollars: 0,
  ...overrides
} as EventModel);

describe('EventDetailsComponent live event stream', () => {
  it('keeps what the visitor typed when the event document changes', () => {
    const stream = new Subject<EventModel[]>();
    const component = buildStreamedComponent(stream);
    component.ngOnInit();

    stream.next([eventDoc()]);
    component.attendeesForm.at(0).patchValue({
      firstName: 'Zara', lastName: 'Zztester', email: 'zztester@summit.test'
    });

    // Staff touch the event while the visitor is mid-form.
    stream.next([eventDoc({ eventName: 'Summit (renamed)' })]);

    expect(component.attendeesForm.at(0).value).toEqual({
      firstName: 'Zara', lastName: 'Zztester', email: 'zztester@summit.test'
    });
  });

  it('keeps extra attendees the visitor added', () => {
    const stream = new Subject<EventModel[]>();
    const component = buildStreamedComponent(stream);
    component.ngOnInit();

    stream.next([eventDoc({ costInDollars: 25 })]);
    component.increment();
    component.increment();
    expect(component.attendeesForm.length).toBe(3);

    stream.next([eventDoc({ costInDollars: 25 })]);

    // Resetting to one attendee also silently re-prices the order on screen.
    expect(component.attendeesForm.length).toBe(3);
    expect(component.cartItem.orderQuantity).toBe(3);
    expect(component.total).toBe(75);
  });

  it('still picks up event fields that genuinely changed', () => {
    // The rebuild was not pointless - a live listener exists so the page
    // reflects edits. Fixing the wipe must not turn the page into a snapshot
    // taken at first load.
    const stream = new Subject<EventModel[]>();
    const component = buildStreamedComponent(stream);
    component.ngOnInit();

    stream.next([eventDoc({ eventName: 'Summit', costInDollars: 25 })]);
    stream.next([eventDoc({ eventName: 'Summit 2027', costInDollars: 40 })]);

    expect(component.event.eventName).toBe('Summit 2027');
    expect(component.cartItem.itemName).toBe('Summit 2027');
    expect(component.cartItem.price).toBe(40);
    expect(component.total).toBe(40);
  });

  it('builds the form once on the first emission', () => {
    const stream = new Subject<EventModel[]>();
    const component = buildStreamedComponent(stream);
    component.ngOnInit();

    expect(component.attendeesForm.length).toBe(0);

    stream.next([eventDoc()]);

    expect(component.attendeesForm.length).toBe(1);
    expect(component.cartItem.orderQuantity).toBe(1);
  });
});
