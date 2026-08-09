import { Component, OnInit,  } from '@angular/core';
import { ConsultationSurveyModel } from 'src/app/common/models/domain/consultation-survey.model';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { Timestamp } from 'firebase/firestore';
import { Phone } from 'src/app/common/models/domain/utils/phone.model';
import { ConsultationSurveyService } from 'src/app/common/services/data/consultation-survey.service';
import { EMailService } from 'src/app/common/services/data/email.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { EnumHelper } from 'src/app/common/utils/enum_helper';
import { Address } from 'src/app/common/models/domain/utils/address.model';
import notify from 'devextreme/ui/notify';

@Component({
    selector: 'app-consultation-survey',
    templateUrl: './consultation-survey.component.html',
    styleUrls: ['./consultation-survey.component.scss'],
    standalone: false
})
export class ConsultationSurveyComponent implements OnInit {
  consultationSurveyForm: ConsultationSurveyModel;

  registerButtonOptions: DxButtonTypes.Properties = {
    text: 'Submit Free Consultation',
    useSubmitBehavior: true,
    elementAttr: { class: 'os-btn lunch-form__button mt-30' }
  };

  phoneEditorOptions = {
    mask: '(X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  public states: string[];

  constructor(private consultationSurveyService: ConsultationSurveyService,
    private emailService: EMailService,
    private webConfigService: WebConfigService){}

  ngOnInit(): void {
    this.consultationSurveyForm = {... new ConsultationSurveyModel()};
    this.consultationSurveyForm.location = {... new Address()};
    this.consultationSurveyForm.phone = {... new Phone()};

    this.states = EnumHelper.getStateTypesAsArray();
  }

  onSubmitForm() {
    this.consultationSurveyForm.date = Timestamp.now();
    this.consultationSurveyForm.dateString = new Date().toDateString();

    this.webConfigService.getAll().then(config => {
      return config[0].adminEmailAddress;
    }).then (email => {
      this.consultationSurveyService.add(this.consultationSurveyForm).then((form) => {
        notify({
          message: "Consultation Survey submited Successfully!",
          position: 'top',
          width: 600,
          type: 'success'
        });
        return form;
      }).then(form => {
        this.emailService.sendTemplateEmail(email, 'Consultation Survey Template', form);
      })
    })
  }
}
