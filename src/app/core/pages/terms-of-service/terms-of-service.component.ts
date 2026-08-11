import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { Component, OnInit } from '@angular/core';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';

@Component({
    selector: 'app-terms-of-service',
    templateUrl: './terms-of-service.component.html',
    styleUrls: ['./terms-of-service.component.scss'],
    standalone: false
})
export class TermsOfServiceComponent implements OnInit  {
  public webConfig: WebConfigModel;

  constructor(private webConfigService: WebConfigService){

  }

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => {
      return configs[0];
    });
  }
}
