import { ToastrService } from 'ngx-toastr';
import { Component, OnInit,  } from '@angular/core';
import { ConsultationSurveyModel } from 'impactdisciplescommon/src/models/domain/consultation-survey.model';
import { ConsultationSurveyService } from 'impactdisciplescommon/src/services/consultation-survey.service';
import { DxButtonTypes } from 'devextreme-angular/ui/button';

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

  phonePattern = /^[02-9]\d{9}$/;

  phoneEditorOptions = {
    mask: '+1 (X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct USA phone format',
    valueChangeEvent: 'keyup',
  };

  constructor(private consultationSurveyService: ConsultationSurveyService, private toastrService: ToastrService){}

  ngOnInit(): void {
    this.consultationSurveyForm = {... new ConsultationSurveyModel()};
  }

  onSubmitForm() {
    this.consultationSurveyService.add(this.consultationSurveyForm).then(() => {
      this.toastrService.success("Consultation Survey submited Successfully!");
    })
  }

}
