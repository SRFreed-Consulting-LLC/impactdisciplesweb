import { Component, OnInit } from '@angular/core';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { Timestamp } from 'firebase/firestore';
import { ConsultationRequestModel } from 'src/app/common/models/domain/consultation-request.model';
import { ConsultationRequestService } from 'src/app/common/services/data/consultation-request.service';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import notify from 'devextreme/ui/notify';

@Component({
    selector: 'app-seminars',
    templateUrl: './seminars.component.html',
    styleUrls: ['./seminars.component.scss'],
    standalone: false
})
export class SeminarsComponent implements OnInit {
  isPlaying: boolean = false;

  public impactDisciplesInfo = impactDisciplesInfo;

  public webConfig: WebConfigModel = new WebConfigModel();
  public consultationRequest: ConsultationRequestModel;

  constructor(public utilsService: UtilsService,
    private webConfigService: WebConfigService,
    private consultationRequestService: ConsultationRequestService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => {
      return configs[0];
    });

    this.consultationRequest = {... new ConsultationRequestModel()};
  }

  handleFormSubmit(){
    this.consultationRequest.date = Timestamp.now();

    this.consultationRequestService.add(this.consultationRequest).then(() => {
      notify({
        message: 'Consultation Request submitted Successfully!',
        position: 'top',
        width: 600,
        type: 'success'
      });
    })
  }

  playVideo(){
    this.isPlaying = true;
  }
}
