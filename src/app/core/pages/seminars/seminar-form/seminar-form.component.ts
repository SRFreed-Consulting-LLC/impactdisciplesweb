import { DxFormComponent } from 'devextreme-angular';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { Timestamp } from 'firebase/firestore';
import { CoachModel } from 'src/app/common/models/domain/coach.model';
import { SeminarModel } from 'src/app/common/models/domain/seminar.model';
import { Address } from 'src/app/common/models/domain/utils/address.model';
import { Phone } from 'src/app/common/models/domain/utils/phone.model';
import { map, Observable } from 'rxjs';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { CoachService } from 'src/app/common/services/data/coach.service';
import { EMailService } from 'src/app/common/services/data/email.service';
import { LocationService } from 'src/app/common/services/data/location.service';
import { SeminarService } from 'src/app/common/services/data/seminar.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import notify from 'devextreme/ui/notify';

@Component({
    selector: 'app-seminar-form',
    templateUrl: './seminar-form.component.html',
    styleUrls: ['./seminar-form.component.scss'],
    standalone: false
})
export class SeminarFormComponent implements OnInit {
  @ViewChild('seminarRequestFormComponent', { static: false }) seminarRequestFormComponent: DxFormComponent;

  seminarForm: SeminarModel;
  coaches$: Observable<CoachModel[]>;

  constructor(public locationService: LocationService,
    private seminarService: SeminarService,
    private webConfigService: WebConfigService,
    private emailService: EMailService,
    private coachService: CoachService
  ){}

  registerButtonOptions: DxButtonTypes.Properties = {
    text: 'Request to Book a Seminar',
    useSubmitBehavior: true,
    elementAttr: { class: 'os-btn seminar-form__button mt-30' }
  };

  phonePattern = /^[02-9]\d{9}$/;

  phoneEditorOptions = {
    mask: '(X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  public states: string[];

  ngOnInit(): void {
    this.seminarForm = {...new SeminarModel()};
    this.seminarForm.phone = {... new Phone()};
    this.seminarForm.preferredLocation = {... new Address()};


    this.coaches$ = this.coachService.streamAll().pipe(
      map(coaches => {
        coaches.forEach(coach => coach.fullname = coach.firstName + ' ' + coach.lastName)

        return coaches;
      })
    );

    this.states = EnumHelper.getStateTypesAsArray();
  }

  onSubmitForm() {
    if(this.seminarRequestFormComponent.instance.validate().isValid) {
      this.seminarForm.date = Timestamp.now();
      this.seminarForm.dateString = new Date().toDateString();
      this.seminarForm.requestedDateString = dateFromTimestamp(this.seminarForm.requestedDate as Timestamp).toDateString();
      this.seminarForm.requestedStartTimeString = dateFromTimestamp(this.seminarForm.requestedStartTime as Timestamp).toTimeString();
      this.seminarForm.requestedEndTimeString = dateFromTimestamp(this.seminarForm.requestedEndTime as Timestamp).toTimeString();

      this.webConfigService.getAll().then(config => {
        return config[0].adminEmailAddress;
      }).then (email => {
        this.seminarService.add(this.seminarForm).then((form) => {
          notify({
            message: "Seminar Request Form submitted Successfully!",
            position: 'top',
            width: 600,
            type: 'success'
          });

          return form;
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
