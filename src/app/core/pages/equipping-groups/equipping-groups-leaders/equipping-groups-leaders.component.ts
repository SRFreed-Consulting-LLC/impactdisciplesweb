import { Component } from '@angular/core';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-equipping-groups-leaders',
    templateUrl: './equipping-groups-leaders.component.html',
    styleUrls: ['./equipping-groups-leaders.component.scss'],
    standalone: false
})
export class EquippingGroupsLeadersComponent  {
  public webConfig: WebConfigModel = new WebConfigModel();
  isPlaying = false;

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
