import { Pipe, PipeTransform } from '@angular/core';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { CourseService } from 'src/app/common/services/data/course.service';

// TRANSITION SHIM (2026-08 Courses retirement): takes the whole agenda
// ITEM now, preferring its own `text` (breakouts are self-contained) and
// falling back to the legacy courses/{id} lookup only for items authored
// before the flatten backfill. Delete this pipe (and CourseService) once
// every live event's items carry their own text - see breakout.util.ts.
@Pipe({
    name: 'courseName',
    standalone: false
})
export class CourseNamePipe implements PipeTransform {

  constructor(private courseService: CourseService) {}
  async transform(item: AgendaItem | null | undefined): Promise<string> {
    if (item?.text) {
      return item.text;
    }
    if (!item?.course) {
      return '';
    }
    const course = await this.courseService.getByIdCached(item.course);
    return (course?.title ?? '').replace('Breakout: ', '');
  }
}
