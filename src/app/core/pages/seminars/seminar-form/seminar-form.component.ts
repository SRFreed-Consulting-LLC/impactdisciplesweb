import { DxFormComponent } from 'devextreme-angular';
import { CoachService } from './../../../../../../impactdisciplescommon/src/services/coach.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { Timestamp } from 'firebase/firestore';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { SeminarModel } from 'impactdisciplescommon/src/models/domain/seminar.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { SeminarService } from 'impactdisciplescommon/src/services/seminar.service';
import { ToastrService } from 'ngx-toastr';
import { map, Observable } from 'rxjs';
import { WebConfigService } from 'impactdisciplescommon/src/services/utils/web-config.service';
import { EMailService } from 'impactdisciplescommon/src/services/admin/email.service';

@Component({
  selector: 'app-seminar-form',
  templateUrl: './seminar-form.component.html',
  styleUrls: ['./seminar-form.component.scss']
})
export class SeminarFormComponent implements OnInit {
  @ViewChild('seminarRequestFormComponent', { static: false }) seminarRequestFormComponent: DxFormComponent;

  seminarForm: SeminarModel;
  locations$: Observable<LocationModel[]>;
  coaches$: Observable<CoachModel[]>;

  constructor(public locationService: LocationService, private seminarService: SeminarService, private webConfigService: WebConfigService,
    private emailService: EMailService, private toastrService: ToastrService, private coachService: CoachService
  ){}

  registerButtonOptions: DxButtonTypes.Properties = {
    text: 'Request to Book a Seminar',
    useSubmitBehavior: true,
    elementAttr: { class: 'os-btn seminar-form__button mt-30' }
  };

  phonePattern = /^[02-9]\d{9}$/;

  phoneEditorOptions = {
    mask: '+1 (X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  ngOnInit(): void {
    this.seminarForm = {...new SeminarModel()};
    this.seminarForm.phone = {... new Phone()};

    this.locations$ = this.locationService.streamAll();

    this.coaches$ = this.coachService.streamAll().pipe(
      map(coaches => {
        coaches.forEach(coach => coach.fullname = coach.firstName + ' ' + coach.lastName)

        return coaches;
      })
    );
  }

  onSubmitForm() {
    if(this.seminarRequestFormComponent.instance.validate().isValid) {
      this.seminarForm.date = Timestamp.now();

      this.webConfigService.getAll().then(config => {
        return config[0].adminEmailAddress;
      }).then (email => {
        this.seminarService.add(this.seminarForm).then(() => {
          this.toastrService.success("Seminar Request Form submitted Successfully!");
        }).then(form => {
          this.emailService.sendTemplateEmail(email, 'Seminar Template', form);
        })
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
