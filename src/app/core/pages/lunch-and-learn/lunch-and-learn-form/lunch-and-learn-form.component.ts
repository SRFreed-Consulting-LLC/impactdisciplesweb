import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { LunchAndLearnModel } from 'impactdisciplescommon/src/models/domain/lunch-and-learn.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { LunchAndLearnService } from 'impactdisciplescommon/src/services/lunch-and-learn.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lunch-and-learn-form',
  templateUrl: './lunch-and-learn-form.component.html',
  styleUrls: ['./lunch-and-learn-form.component.scss']
})
export class LunchAndLearnFormComponent implements OnInit {
  @ViewChild('lunchRequestFormComponent', { static: false }) lunchRequestFormComponent: DxFormComponent;
  lunchRequestForm: LunchAndLearnModel;
  locations$: Observable<LocationModel[]>;

  constructor(public locationService: LocationService, private lunchAndLearnService: LunchAndLearnService){}

  ngOnInit(): void {
    this.locations$ = this.locationService.streamAll()
  }

  onSubmitForm() {
    if(this.lunchRequestFormComponent.instance.validate()) {
      this.lunchAndLearnService.add(this.lunchRequestForm)
    }
  }

  displayAddress(item: any): string {
    if (!item) return '';

    const address: Address = item.address;
    const fullAddress = `${address.address1}, ${address.city}, ${address.state}, ${address.zip}`;
    return fullAddress;
  }

}