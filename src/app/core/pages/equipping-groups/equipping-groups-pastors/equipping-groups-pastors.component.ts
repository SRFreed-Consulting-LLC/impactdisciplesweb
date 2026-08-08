import { Component } from '@angular/core';
import { WebConfigModel } from 'impactdisciplescommon/src/models/utils/web-config.model';
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-equipping-groups-pastors',
    templateUrl: './equipping-groups-pastors.component.html',
    styleUrls: ['./equipping-groups-pastors.component.scss'],
    standalone: false
})
export class EquippingGroupsPastorsComponent  {
  public webConfig: WebConfigModel = new WebConfigModel();
  isPlaying: boolean = false;

  constructor(public utilsService: UtilsService, private webConfigService: WebConfigService) { }

  async ngOnInit(): Promise<void> {
    this.webConfig = await this.webConfigService.getAll().then(configs => {
      return configs[0];
    });
  }

  playVideo(){
    this.isPlaying = true;
  }
}
