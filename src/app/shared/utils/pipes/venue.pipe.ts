import { Pipe, PipeTransform } from '@angular/core';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { Address } from '@impact-common/shared/models/domain/utils/address.model';
import { LocationService } from 'src/app/common/services/data/location.service';

// Venue-aware sibling of LocationPipe (2026-08 restructure): takes the
// whole EVENT and prefers its denormalized `venue` snapshot - an event held
// at a single-site organization has no location record at all, and the
// `organizations` collection is staff-only readable, so the snapshot is the
// only way this site can render such a venue. Events saved before the
// snapshot existed fall back to the old locations/{id} lookup.
@Pipe({
    name: 'venue',
    standalone: false
})
export class VenuePipe implements PipeTransform {

  constructor(private locationService: LocationService) {}

  async transform(event: EventModel | null | undefined, format: 'full' | 'name' | 'cityState' | 'address' = 'full'): Promise<string> {
    if (!event) {
      return '';
    }

    if (event.venue?.name) {
      return this.format(event.venue.name, event.venue.address ?? {}, format);
    }

    const locationId = typeof event.location === 'string' ? event.location : event.location?.id;
    if (!locationId) {
      return '';
    }
    const location = await this.locationService.getByIdCached(locationId);
    if (!location) {
      return '';
    }
    return this.format(location.name, location.address ?? {}, format);
  }

  private format(name: string, address: Address, format: 'full' | 'name' | 'cityState' | 'address'): string {
    switch (format) {
      case 'name':
        return name;

      case 'cityState':
        return `${address.city ?? ''}, ${address.state ?? ''}`;

      case 'address':
        return `${address.address1 ?? ''}, ${address.address2 || ''} ${address.city ?? ''}, ${address.state ?? ''} ${address.zip ?? ''}`;

      case 'full':
      default:
        return `${name}, ${address.address1 ?? ''}, ${address.address2 || ''} ${address.city ?? ''}, ${address.state ?? ''} ${address.zip ?? ''}`;
    }
  }
}
