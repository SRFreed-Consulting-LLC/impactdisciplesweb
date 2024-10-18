import { Component, OnInit } from '@angular/core';
import { WebConfigModel } from 'impactdisciplescommon/src/models/utils/web-config.model';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';
import { ToastrService } from 'ngx-toastr';
import { Timestamp } from 'firebase/firestore';
import { ConsultationRequestModel } from 'impactdisciplescommon/src/models/domain/consultation-request.model';
import { ConsultationRequestService } from 'impactdisciplescommon/src/services/data/consultation-request.service';
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';

@Component({
  selector: 'app-seminars',
  templateUrl: './seminars.component.html',
  styleUrls: ['./seminars.component.scss']
})
export class SeminarsComponent implements OnInit {
  isPlaying: boolean = false;

  public impactDisciplesInfo = impactDisciplesInfo;

  public webConfig: WebConfigModel;
  public consultationRequest: ConsultationRequestModel;

  constructor(public utilsService: UtilsService, private webConfigService: WebConfigService, private consultationRequestService: ConsultationRequestService,
    private toastrService: ToastrService
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
      this.toastrService.success('Consultation Request submitted Successfully!');
    })
  }

  playVideo(){
    this.isPlaying = true;
  }
}
