import { of } from 'rxjs';
import { PrayerTeamComponent } from './prayer-team.component';
import { SubscribeFormService } from 'src/app/shared/utils/services/subscribe-form.service';

// Characterization suite written BEFORE the subscribe-flow extraction
// (bucket A, web item 1). See footer.component.spec.ts for the full
// rationale. This is the one of the three that is NOT a newsletter form -
// it subscribes type 'prayer' and every user-facing string differs, which
// is exactly what the extraction has to keep straight.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('PrayerTeamComponent subscribe flow', () => {
  let toasts: { message: string; type: string }[];
  let logged: { type: string; createdBy: string; message: string }[];
  let createSubscription: jasmine.Spy;
  let component: PrayerTeamComponent;

  beforeEach(() => {
    toasts = [];
    logged = [];
    createSubscription = jasmine.createSpy('createSubscription');

    // The real SubscribeFormService, built from the same three duck-typed
    // deps the component itself used to take. Only this construction
    // changed in the extraction - every assertion below is untouched.
    //
    // The second argument is the page-content lookup added 2026-08-29 so
    // this page's heading can be edited in the admin. It plays no part in
    // the subscribe flow these tests cover, so it is a stub that returns no
    // blocks - which is also the state the live page is in until someone
    // saves something.
    component = new PrayerTeamComponent(
      new SubscribeFormService(
        { createSubscription } as never,
        { notify: (o: { message: string; type: string }) => toasts.push(o) } as never,
        {
          logMessage: (type: string, createdBy: string, message: string) => {
            logged.push({ type, createdBy, message });
            return of('EC-9012');
          }
        } as never
      ),
      { blocksFor: () => of({}) } as never
    );
    component.prayerTeamSubscription.firstName = 'Casey';
    component.prayerTeamSubscription.lastName = 'Contact';
    component.prayerTeamSubscription.email = 'casey@contacts.test';
  });

  it('subscribes as prayer, not newsletter, and reports success', async () => {
    createSubscription.and.returnValue(Promise.resolve({ email: 'casey@contacts.test' }));

    component.handleFormSubmit();
    await flush();

    expect(createSubscription).toHaveBeenCalledWith(
      'prayer', 'Casey', 'Contact', 'casey@contacts.test'
    );
    expect(toasts).toEqual([
      { message: 'Prayer Team Subscription added Successfully!', type: 'success' }
    ]);
  });

  it('reports an existing member as info, with prayer-team wording', async () => {
    createSubscription.and.returnValue(Promise.resolve(null));

    component.handleFormSubmit();
    await flush();

    expect(toasts).toEqual([
      { message: 'Your email is already a member of our Prayer Team!', type: 'info' }
    ]);
  });

  it('logs a failure under its own code and says "submission", not "subscription"', async () => {
    createSubscription.and.returnValue(Promise.reject(new Error('boom')));

    component.handleFormSubmit();
    await flush();

    expect(logged).toEqual([{
      type: 'PRAYER_TEAM_SUBSCRIBE',
      createdBy: 'casey@contacts.test',
      message: 'Failed to join the prayer team.'
    }]);
    expect(toasts).toEqual([{
      message: 'We could not complete your submission. Please try again - reference code: EC-9012',
      type: 'error'
    }]);
  });
});
