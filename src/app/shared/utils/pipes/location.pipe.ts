import { Pipe, PipeTransform } from '@angular/core';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';

@Pipe({
  name: 'location'
})
export class LocationPipe implements PipeTransform {

  constructor(private locationService: LocationService) {}
  transform(locationId: string, format: 'full' | 'name' | 'cityState' = 'full'): Promise<string> {
    return this.locationService.getById(locationId).then(location => {
      if (!location) {
        return '';
      }

      switch (format) {
        case 'name':
          return location.name;

        case 'cityState':
          return `${location.address.city}, ${location.address.state}`;

        case 'full':
        default:
          return `${location.name}, ${location.address}, ${location.address.city}, ${location.address.state} ${location.address.zip}`;
      }
    });
  }
}