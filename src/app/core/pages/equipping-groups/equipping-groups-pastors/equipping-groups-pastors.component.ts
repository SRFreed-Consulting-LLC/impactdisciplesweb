import { Component, OnInit } from '@angular/core';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-equipping-groups-pastors',
    templateUrl: './equipping-groups-pastors.component.html',
    styleUrls: ['./equipping-groups-pastors.component.scss'],
    standalone: false
})
export class EquippingGroupsPastorsComponent implements OnInit {
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
