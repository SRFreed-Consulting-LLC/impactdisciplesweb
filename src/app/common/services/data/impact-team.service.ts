import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { ImpactTeamMemberModel } from '@impact-common/shared/models/domain/impact-team-member.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class ImpactTeamService extends BaseService<ImpactTeamMemberModel>{
  constructor(public override dao: FirebaseDAO<ImpactTeamMemberModel> ) {
    super(dao)
    this.table="impact_team"
    this.fromFirestore = ImpactTeamService.fromFirestore
  }

  static readonly fromFirestore = (data): ImpactTeamMemberModel => {
    data.fullname = data.firstName + " " + data.lastName

    return data;
  };

}
