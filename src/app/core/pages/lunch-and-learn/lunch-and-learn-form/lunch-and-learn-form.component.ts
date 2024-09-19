import { EMailService } from './../../../../../../impactdisciplescommon/src/services/admin/email.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { Timestamp } from 'firebase/firestore';
import { LunchAndLearnModel } from 'impactdisciplescommon/src/models/domain/lunch-and-learn.model';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { LunchAndLearnService } from 'impactdisciplescommon/src/services/lunch-and-learn.service';
import { WebConfigService } from 'impactdisciplescommon/src/services/utils/web-config.service';
import { dateFromTimestamp } from 'impactdisciplescommon/src/utils/date-from-timestamp';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lunch-and-learn-form',
  templateUrl: './lunch-and-learn-form.component.html',
  styleUrls: ['./lunch-and-learn-form.component.scss']
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

  constructor(private lunchAndLearnService: LunchAndLearnService, private webConfigService: WebConfigService,
    private emailService: EMailService, private toastrService: ToastrService
  ){}

  ngOnInit(): void {
    this.lunchRequestForm = {... new LunchAndLearnModel()};
    this.lunchRequestForm.coordinatorPhone = {... new Phone()};
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
          this.toastrService.success("Lunch and Learn Request submited Successfully!");
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
