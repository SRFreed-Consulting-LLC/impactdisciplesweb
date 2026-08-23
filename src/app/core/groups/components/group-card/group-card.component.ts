import { Component, Input } from '@angular/core';
import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';
import {
  capacityLine,
  distanceLine,
  isFull,
  locationLine,
  meetingBadge,
  whenLine,
} from '../../utils/group-display.util';

/**
 * One Impact Group, as a card. Shared by the finder grid and the store
 * product page's "groups studying this book" strip, so it must render
 * correctly with no location, no capacity and no distance - all three are
 * genuinely absent on real groups.
 */
@Component({
  selector: 'app-group-card',
  standalone: false,
  templateUrl: './group-card.component.html',
  styleUrls: ['./group-card.component.scss'],
})
export class GroupCardComponent {
  @Input() group!: PublicGroupSummary;

  get badge(): string {
    return meetingBadge(this.group);
  }

  get where(): string {
    return locationLine(this.group);
  }

  get when(): string {
    return whenLine(this.group);
  }

  get distance(): string | undefined {
    return distanceLine(this.group);
  }

  get capacity(): string {
    return capacityLine(this.group);
  }

  get full(): boolean {
    return isFull(this.group);
  }
}
