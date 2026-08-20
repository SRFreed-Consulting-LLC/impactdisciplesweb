import { VenuePipe } from './venue.pipe';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { LocationModel } from 'src/app/common/models/domain/location.model';
import { LocationService } from 'src/app/common/services/data/location.service';

// The pipe's only dependency is LocationService.getByIdCached() -- a plain
// object with that one spy stands in for the whole BaseService/FirebaseDAO/
// AngularFire graph, which would otherwise need a real Firebase app.
function locationServiceReturning(location: LocationModel | null): {
  service: LocationService;
  getByIdCached: jasmine.Spy;
} {
  const getByIdCached = jasmine.createSpy('getByIdCached').and.returnValue(Promise.resolve(location));
  return { service: { getByIdCached } as unknown as LocationService, getByIdCached };
}

const event = (fields: Partial<EventModel>): EventModel => fields as EventModel;

const ADDRESS = {
  address1: '1 Main St',
  address2: 'Suite 2',
  city: 'Atlanta',
  state: 'GA',
  zip: '30301'
};

describe('VenuePipe', () => {
  describe('with a denormalized venue snapshot on the event', () => {
    it('renders the snapshot WITHOUT any location lookup', async () => {
      const { service, getByIdCached } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(
        event({ venue: { name: 'Crossroads', address: ADDRESS }, location: 'loc-1' })
      );

      expect(result).toBe('Crossroads, 1 Main St, Suite 2 Atlanta, GA 30301');
      expect(getByIdCached).not.toHaveBeenCalled();
    });

    it('renders just the name in "name" mode', async () => {
      const { service, getByIdCached } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ venue: { name: 'Crossroads', address: ADDRESS } }), 'name');

      expect(result).toBe('Crossroads');
      expect(getByIdCached).not.toHaveBeenCalled();
    });

    it('renders the address only (no name) in "address" mode', async () => {
      const { service } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ venue: { name: 'Crossroads', address: ADDRESS } }), 'address');

      expect(result).toBe('1 Main St, Suite 2 Atlanta, GA 30301');
    });

    it('renders "City, ST" in "cityState" mode', async () => {
      const { service } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ venue: { name: 'Crossroads', address: ADDRESS } }), 'cityState');

      expect(result).toBe('Atlanta, GA');
    });

    it('tolerates a snapshot with no address at all ("name" mode still works)', async () => {
      const { service } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ venue: { name: 'Crossroads', address: undefined } }), 'name');

      expect(result).toBe('Crossroads');
    });
  });

  describe('legacy fallback (event saved before venue snapshots existed)', () => {
    const storedLocation = { name: 'Legacy Hall', address: ADDRESS } as LocationModel;

    it('looks the location up by its string id', async () => {
      const { service, getByIdCached } = locationServiceReturning(storedLocation);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ location: 'loc-1' }), 'name');

      expect(getByIdCached).toHaveBeenCalledOnceWith('loc-1');
      expect(result).toBe('Legacy Hall');
    });

    it('accepts an embedded location object and uses its id', async () => {
      const { service, getByIdCached } = locationServiceReturning(storedLocation);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ location: { id: 'loc-2' } as LocationModel }), 'full');

      expect(getByIdCached).toHaveBeenCalledOnceWith('loc-2');
      expect(result).toBe('Legacy Hall, 1 Main St, Suite 2 Atlanta, GA 30301');
    });

    it('returns empty string when the location record no longer exists', async () => {
      const { service } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      expect(await pipe.transform(event({ location: 'gone' }))).toBe('');
    });

    it('a snapshot with only an address but no name is NOT used -- falls through to the lookup', async () => {
      // The guard is on venue.name specifically.
      const { service, getByIdCached } = locationServiceReturning(storedLocation);
      const pipe = new VenuePipe(service);

      const result = await pipe.transform(event({ venue: { name: '', address: ADDRESS }, location: 'loc-1' }), 'name');

      expect(getByIdCached).toHaveBeenCalledOnceWith('loc-1');
      expect(result).toBe('Legacy Hall');
    });
  });

  describe('empty inputs', () => {
    it('returns empty string for a null/undefined event without touching the service', async () => {
      const { service, getByIdCached } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      expect(await pipe.transform(null)).toBe('');
      expect(await pipe.transform(undefined)).toBe('');
      expect(getByIdCached).not.toHaveBeenCalled();
    });

    it('returns empty string for an event with neither snapshot nor location', async () => {
      const { service, getByIdCached } = locationServiceReturning(null);
      const pipe = new VenuePipe(service);

      expect(await pipe.transform(event({}))).toBe('');
      expect(getByIdCached).not.toHaveBeenCalled();
    });
  });
});
