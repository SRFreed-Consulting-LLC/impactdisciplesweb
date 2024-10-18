import { Pipe, PipeTransform } from '@angular/core';
import { LocationService } from 'impactdisciplescommon/src/services/data/location.service';

@Pipe({
  name: 'location'
})
export class LocationPipe implements PipeTransform {

  constructor(private locationService: LocationService) {}
  transform(locationId: string, format: 'full' | 'name' | 'cityState' | 'address' = 'full'): Promise<string> {
    return this.locationService.getById(locationId).then(location => {
      if (!location) {
        return '';
      }

      switch (format) {
        case 'name':
          return location.name;

        case 'cityState':
          return `${location.address.city}, ${location.address.state}`;

        case 'address':
          return `${location.address.address1}, ${location.address.address2 || ''} ${location.address.city}, ${location.address.state} ${location.address.zip}`;

        case 'full':
        default:
          return `${location.name}, ${location.address.address1}, ${location.address.address2 || ''} ${location.address.city}, ${location.address.state} ${location.address.zip}`;
      }
    });
  }
}
