import { ToastrService } from 'ngx-toastr';
import { Component, OnInit,  } from '@angular/core';
import { ConsultationSurveyModel } from 'impactdisciplescommon/src/models/domain/consultation-survey.model';
import { ConsultationSurveyService } from 'impactdisciplescommon/src/services/consultation-survey.service';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { EMailService } from 'impactdisciplescommon/src/services/admin/email.service';
import { Timestamp } from 'firebase/firestore';

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
    mask: '+1 (X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  constructor(private consultationSurveyService: ConsultationSurveyService, private emailService: EMailService, private toastrService: ToastrService){}

  ngOnInit(): void {
    this.consultationSurveyForm = {... new ConsultationSurveyModel()};
  }

  onSubmitForm() {
    this.consultationSurveyForm.date = Timestamp.now();
    this.consultationSurveyForm.dateString = new Date().toDateString();

    this.consultationSurveyService.add(this.consultationSurveyForm).then((form) => {
      this.toastrService.success("Consultation Survey submited Successfully!");

      this.emailService.sendTemplateEmail("shane.freed@gmail.com", 'Consultation Survey Template', form);
    })
  }

}
