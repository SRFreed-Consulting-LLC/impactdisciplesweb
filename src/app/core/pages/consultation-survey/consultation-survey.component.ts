import { Component, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { ConsultationSurveyModel } from 'impactdisciplescommon/src/models/domain/consultation-survey.model';
import { ConsultationSurveyService } from 'impactdisciplescommon/src/services/consultation-survey.service';

@Component({
  selector: 'app-consultation-survey',
  templateUrl: './consultation-survey.component.html',
  styleUrls: ['./consultation-survey.component.scss']
})
export class ConsultationSurveyComponent {
  @ViewChild('consultationPresurveyFormComponent', { static: false }) consultationPresurveyFormComponent: DxFormComponent;
  consultationSurveyForm: ConsultationSurveyModel;

  constructor(private consultationSurveyService: ConsultationSurveyService){}

  onSubmitForm() {
    if(this.consultationPresurveyFormComponent.instance.validate()) {
      this.consultationSurveyService.add(this.consultationSurveyForm)
    }
  }

}