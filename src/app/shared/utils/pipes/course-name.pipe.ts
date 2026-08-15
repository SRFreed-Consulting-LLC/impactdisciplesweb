import { Pipe, PipeTransform } from '@angular/core';
import { CourseService } from 'src/app/common/services/data/course.service';

@Pipe({
    name: 'courseName',
    standalone: false
})
export class CourseNamePipe implements PipeTransform {

  constructor(private courseService: CourseService) {}
  transform(courseId: string): Promise<string> {
    return this.courseService.getByIdCached(courseId).then(course => {
      return course?.title ?? '';
    });
  }
}
