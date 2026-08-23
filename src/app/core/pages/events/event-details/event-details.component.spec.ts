import { FormBuilder } from '@angular/forms';
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
