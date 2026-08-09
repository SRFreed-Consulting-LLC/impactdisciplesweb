import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { Timestamp } from 'firebase/firestore';
import { LunchAndLearnModel } from 'src/app/common/models/domain/lunch-and-learn.model';
import { Address } from 'src/app/common/models/domain/utils/address.model';
import { Phone } from 'src/app/common/models/domain/utils/phone.model';
import { EMailService } from 'src/app/common/services/data/email.service';
import { LunchAndLearnService } from 'src/app/common/services/data/lunch-and-learn.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { EnumHelper } from 'src/app/common/utils/enum_helper';

@Component({
    selector: 'app-lunch-and-learn-form',
    templateUrl: './lunch-and-learn-form.component.html',
    styleUrls: ['./lunch-and-learn-form.component.scss'],
    standalone: false
})
export class LunchAndLearnFormComponent implements OnInit {
  @ViewChild('lunchRequestFormComponent', { static: false }) lunchRequestFormComponent: DxFormComponent;
  lunchRequestForm: LunchAndLearnModel;

  phoneEditorOptions = {
    mask: '(X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  public states: string[];

  constructor(private lunchAndLearnService: LunchAndLearnService,
    private webConfigService: WebConfigService,
    private emailService: EMailService
  ){}

  ngOnInit(): void {
    this.lunchRequestForm = {... new LunchAndLearnModel()};
    this.lunchRequestForm.coordinatorPhone = {... new Phone()};
    this.lunchRequestForm.locationAddress = {... new Address()};

    this.states = EnumHelper.getStateTypesAsArray();
  }

  onSubmitForm() {
    if(this.lunchRequestFormComponent.instance.validate().isValid) {
      this.lunchRequestForm.date = Timestamp.now();

      this.lunchRequestForm.dateString = new Date().toDateString();
      this.lunchRequestForm.requestedDateString = dateFromTimestamp(this.lunchRequestForm.requestedDate as Timestamp).toDateString();
      this.lunchRequestForm.requestedStartTimeString = dateFromTimestamp(this.lunchRequestForm.requestedStartTime as Timestamp).toTimeString();
      this.lunchRequestForm.requestedEndTimeString = dateFromTimestamp(this.lunchRequestForm.requestedEndTime as Timestamp).toTimeString();

      this.webConfigService.getAll().then(config => {
        return config[0].adminEmailAddress;
      }).then (email => {
        this.lunchAndLearnService.add(this.lunchRequestForm).then((form) => {
          notify({
            message: "Lunch and Learn Request submited Successfully!",
            position: 'top',
            width: 600,
            type: 'success'
          });
          return form;
        }).then(form => {
          this.emailService.sendTemplateEmail(email, 'Lunch And Learn Template', form);
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
