import { of } from 'rxjs';
import { FooterComponent } from './footer.component';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

// handleFormSubmit() does not return its promise today, so awaiting the
// call alone would assert before the chain settles. A macrotask tick
// drains the pending microtasks either way, so this holds before and
// after the extraction.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// Characterization suite written BEFORE the subscribe-flow extraction
// (bucket A, web item 1). The footer, subscribe-area and prayer-team
// components each carried their own copy of the same ~30-line submit
// handler, differing only in five strings. These specs pin what a visitor
// actually observes - which toast fires, and what gets logged when the
// request fails - so the extraction can be proven behaviour-preserving:
// this file must pass UNCHANGED before and after it.
//
// Hand-constructed with duck-typed deps, never TestBed - house style, same
// as checkout.component.spec.ts.
describe('FooterComponent subscribe flow', () => {
  let toasts: { message: string; type: string }[];
  let logged: { type: string; createdBy: string; message: string }[];
  let createSubscription: jasmine.Spy;
  let logMessage: jasmine.Spy;
  let component: FooterComponent;

  beforeEach(() => {
    toasts = [];
    logged = [];
    createSubscription = jasmine.createSpy('createSubscription');
    logMessage = jasmine.createSpy('logMessage').and.callFake(
      (type: string, createdBy: string, message: string) => {
        logged.push({ type, createdBy, message });
        return of('EC-1234');
      }
    );

    // The real SubscribeFormService, built from the same three duck-typed
    // deps the component itself used to take. Only this construction
    // changed in the extraction - every assertion below is untouched.
    component = new FooterComponent(
      new SubscribeFormService(
        { createSubscription } as never,
        { notify: (o: { message: string; type: string }) => toasts.push(o) } as never,
        { logMessage } as never
      )
    );
    component.subscription.firstName = 'Casey';
    component.subscription.lastName = 'Contact';
    component.subscription.email = 'casey@contacts.test';
  });

  it('subscribes as newsletter and reports success', async () => {
    createSubscription.and.returnValue(Promise.resolve({ email: 'casey@contacts.test' }));

    component.handleFormSubmit();
    await flush();

    expect(createSubscription).toHaveBeenCalledWith(
      'newsletter', 'Casey', 'Contact', 'casey@contacts.test'
    );
    expect(toasts).toEqual([
      { message: 'Subscription added Successfully!', type: 'success' }
    ]);
  });

  it('reports an already-subscribed address as info, not success', async () => {
    // createSubscription() resolves null when the Cloud Function reports
    // alreadySubscribed - the visitor must not be told they were added.
    createSubscription.and.returnValue(Promise.resolve(null));

    component.handleFormSubmit();
    await flush();

    expect(toasts).toEqual([
      { message: 'Your email is already subscribed to our Newsletter!', type: 'info' }
    ]);
  });

  it('logs a failure and surfaces its reference code to the visitor', async () => {
    createSubscription.and.returnValue(Promise.reject(new Error('boom')));

    component.handleFormSubmit();
    await flush();

    expect(logged).toEqual([{
      type: 'NEWSLETTER_SUBSCRIBE',
      createdBy: 'casey@contacts.test',
      message: 'Failed to subscribe to the newsletter.'
    }]);
    expect(toasts).toEqual([{
      message: 'We could not complete your subscription. Please try again - reference code: EC-1234',
      type: 'error'
    }]);
  });

  // KNOWN GAP, deliberately not pinned here: the error path subscribes as
  // .subscribe(next) with no error callback, so if logMessage() itself
  // fails the visitor gets NO feedback at all. Asserting the desired
  // behaviour would be a wish rather than a characterization, and
  // asserting the current behaviour means asserting on an unhandled RxJS
  // error, which is flaky. Recorded rather than tested; worth fixing on
  // its own once the flow lives in one place.
});
