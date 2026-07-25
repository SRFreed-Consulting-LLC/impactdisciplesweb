import { Pipe, PipeTransform } from '@angular/core';
import { CourseService } from 'impactdisciplescommon/src/services/data/course.service';

@Pipe({
    name: 'courseName',
    standalone: false
})
export class CourseNamePipe implements PipeTransform {

  constructor(private courseService: CourseService) {}
  transform(courseId: string): Promise<string> {
    return this.courseService.getById(courseId).then(course => {
      return course.title
    });
  }
}
