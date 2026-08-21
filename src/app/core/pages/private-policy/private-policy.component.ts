import { Component, OnInit } from '@angular/core';
import { WebConfigModel } from '@impact-common/shared/models/utils/web-config.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';

@Component({
    selector: 'app-private-policy',
    templateUrl: './private-policy.component.html',
    styleUrls: ['./private-policy.component.scss'],
    standalone: false
})
export class PrivatePolicyComponent implements OnInit {
  public webConfig: WebConfigModel;

  constructor(private webConfigService: WebConfigService){}

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => {
      return configs[0];
    });
  }
}
