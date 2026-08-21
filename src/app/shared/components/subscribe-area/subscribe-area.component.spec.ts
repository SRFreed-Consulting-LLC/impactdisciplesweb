import { of } from 'rxjs';
import { SubscribeAreaComponent } from './subscribe-area.component';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

// Characterization suite written BEFORE the subscribe-flow extraction
// (bucket A, web item 1). See footer.component.spec.ts for the full
// rationale - this is the second of the three components that carried a
// copy of the same submit handler. Must pass UNCHANGED across the
// extraction.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SubscribeAreaComponent subscribe flow', () => {
  let toasts: { message: string; type: string }[];
  let logged: { type: string; createdBy: string; message: string }[];
  let createSubscription: jasmine.Spy;
  let component: SubscribeAreaComponent;

  beforeEach(() => {
    toasts = [];
    logged = [];
    createSubscription = jasmine.createSpy('createSubscription');

    // The real SubscribeFormService, built from the same three duck-typed
    // deps the component itself used to take. Only this construction
    // changed in the extraction - every assertion below is untouched.
    component = new SubscribeAreaComponent(
      new SubscribeFormService(
        { createSubscription } as never,
        { notify: (o: { message: string; type: string }) => toasts.push(o) } as never,
        {
          logMessage: (type: string, createdBy: string, message: string) => {
            logged.push({ type, createdBy, message });
            return of('EC-5678');
          }
        } as never
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
      message: 'We could not complete your subscription. Please try again - reference code: EC-5678',
      type: 'error'
    }]);
  });
});
