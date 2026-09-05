import { firstValueFrom } from 'rxjs';
import { LoggerService } from './logger.service';
import { FirebaseDAO } from '../../dao/firebase.dao';
import { LogMessage } from '@impact-common/shared/models/utils/log-message.model';

// A log line is best-effort and must NEVER break its caller. Checkout logs
// a failed shipping quote and then shows the shopper a Retry; if the log
// write itself could reject, the Retry would never appear.
describe('LoggerService.logMessage', () => {
  let create: jasmine.Spy;
  let add: jasmine.Spy;
  let service: LoggerService;

  beforeEach(() => {
    create = jasmine.createSpy('create').and.returnValue(Promise.resolve('new-id'));
    add = jasmine.createSpy('add').and.returnValue(Promise.resolve({}));
    service = new LoggerService({ create, add } as unknown as FirebaseDAO<LogMessage>);
  });

  it('resolves with an 8-character error code the caller can show', async () => {
    const code = await firstValueFrom(service.logMessage('CHECKOUT', 'a@x.test', 'Failed'));
    expect(typeof code).toBe('string');
    expect(code as string).toMatch(/^[0-9a-f]{8}$/);
  });

  it('still resolves with the code when the write is refused (characterization)', async () => {
    create.and.returnValue(Promise.reject(new Error('Missing or insufficient permissions')));
    add.and.returnValue(Promise.reject(new Error('Missing or insufficient permissions')));
    spyOn(console, 'error');

    const code = await firstValueFrom(service.logMessage('CHECKOUT', 'a@x.test', 'Failed'));

    expect(code as string).toMatch(/^[0-9a-f]{8}$/);
  });

  it('writes without asking for the document back - log-messages is write-only to a visitor', async () => {
    await firstValueFrom(service.logMessage('CHECKOUT', 'a@x.test', 'Failed', { err: new Error('x') }));

    expect(create).toHaveBeenCalledTimes(1);
    expect(add).not.toHaveBeenCalled();
    const written = create.calls.mostRecent().args[0] as LogMessage;
    expect(written.type).toBe('CHECKOUT');
    // An Error instance is reduced to plain JSON before it reaches Firestore.
    expect((written.data as { err: { message: string } }).err.message).toBe('x');
  });
});
