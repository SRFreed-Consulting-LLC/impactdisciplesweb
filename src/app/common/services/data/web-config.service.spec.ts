import { WebConfigService } from './web-config.service';
import { FirebaseDAO } from '../../dao/firebase.dao';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';

// The site's one config document, read by eight components on almost every
// page. Two things matter: the read is shared (one Firestore round-trip per
// session, not one per component), and a read that FAILED is not remembered
// as the answer - the next caller must try again, or a single transient
// error at startup leaves the header without a logo, the footer without an
// address and checkout without a PayPal client id until a full reload.
describe('WebConfigService', () => {
  let reads: number;
  let outcome: 'ok' | 'fail';
  let service: WebConfigService;

  const CONFIG = { id: 'c1', email: 'hello@example.com', freeShippingAmount: 50 } as WebConfigModel;

  beforeEach(() => {
    reads = 0;
    outcome = 'ok';
    const dao = {
      getAll: () => {
        reads++;
        return outcome === 'ok' ? Promise.resolve([CONFIG]) : Promise.reject(new Error('offline'));
      }
    } as unknown as FirebaseDAO<WebConfigModel>;
    service = new WebConfigService(dao);
  });

  it('shares one read across every caller (characterization)', async () => {
    await Promise.all([service.getAll(), service.getAll(), service.getConfig()]);
    await service.getConfig();

    expect(reads).toBe(1);
  });

  it('getConfig() hands back the one document rather than a list', async () => {
    expect(await service.getConfig()).toEqual(CONFIG);
  });

  it('getConfig() resolves undefined when the collection is empty', async () => {
    const dao = { getAll: () => Promise.resolve([]) } as unknown as FirebaseDAO<WebConfigModel>;
    expect(await new WebConfigService(dao).getConfig()).toBeUndefined();
  });

  it('does not remember a failed read as the answer', async () => {
    outcome = 'fail';
    await expectAsync(service.getConfig()).toBeRejected();

    outcome = 'ok';
    expect(await service.getConfig()).toEqual(CONFIG);
    expect(reads).toBe(2);
  });
});
