import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { SeminarModel } from 'impactdisciplescommon/src/models/domain/seminar.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { SeminarService } from 'impactdisciplescommon/src/services/seminar.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-seminar-form',
  templateUrl: './seminar-form.component.html',
  styleUrls: ['./seminar-form.component.scss']
})
export class SeminarFormComponent implements OnInit {
  @ViewChild('seminarFormComponent', { static: false }) seminarFormComponent: DxFormComponent;
  seminarForm: SeminarModel;
  locations$: Observable<LocationModel[]>;

  constructor(public locationService: LocationService, private seminarService: SeminarService, private toastrService: ToastrService){}

  ngOnInit(): void {
    this.seminarForm = {...new SeminarModel()};

    this.locations$ = this.locationService.streamAll()
  }

  onSubmitForm() {
    console.log(this.seminarForm);

    if(this.seminarFormComponent.instance.validate()) {
      this.seminarService.add(this.seminarForm).then(() => {
        this.toastrService.success("Seminar Request Form submitted Successfully!");
      })
    }
  }

  displayAddress(item: any): string {
    if (!item) return '';

    const address: Address = item.address;
    const fullAddress = `${address.address1}, ${address.city}, ${address.state}, ${address.zip}`;
    return fullAddress;
  }

}
