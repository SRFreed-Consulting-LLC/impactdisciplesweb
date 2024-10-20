import { ToastrService } from 'ngx-toastr';
import { Component, OnInit,  } from '@angular/core';
import { ConsultationSurveyModel } from 'impactdisciplescommon/src/models/domain/consultation-survey.model';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { Timestamp } from 'firebase/firestore';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { ConsultationSurveyService } from 'impactdisciplescommon/src/services/data/consultation-survey.service';
import { EMailService } from 'impactdisciplescommon/src/services/data/email.service';
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';

@Component({
  selector: 'app-consultation-survey',
  templateUrl: './consultation-survey.component.html',
  styleUrls: ['./consultation-survey.component.scss']
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

  constructor(private consultationSurveyService: ConsultationSurveyService,
    private emailService: EMailService,
    private webConfigService: WebConfigService,
    private toastrService: ToastrService){}

  ngOnInit(): void {
    this.consultationSurveyForm = {... new ConsultationSurveyModel()};
    this.consultationSurveyForm.phone = {... new Phone()};
  }

  onSubmitForm() {
    this.consultationSurveyForm.date = Timestamp.now();
    this.consultationSurveyForm.dateString = new Date().toDateString();

    this.webConfigService.getAll().then(config => {
      return config[0].adminEmailAddress;
    }).then (email => {
      this.consultationSurveyService.add(this.consultationSurveyForm).then((form) => {
        this.toastrService.success("Consultation Survey submited Successfully!");
        return form;
      }).then(form => {
        this.emailService.sendTemplateEmail(email, 'Consultation Survey Template', form);
      })
    })
  }
}
