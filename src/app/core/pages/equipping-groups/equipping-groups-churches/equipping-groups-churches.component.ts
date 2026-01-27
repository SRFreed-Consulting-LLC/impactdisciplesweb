import { Component } from '@angular/core';
import { WebConfigModel } from 'impactdisciplescommon/src/models/utils/web-config.model';
import { WebConfigService } from 'impactdisciplescommon/src/services/data/web-config.service';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-equipping-groups-churches',
  templateUrl: './equipping-groups-churches.component.html',
  styleUrls: ['./equipping-groups-churches.component.scss']
})
export class EquippingGroupsChurchesComponent  {
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
