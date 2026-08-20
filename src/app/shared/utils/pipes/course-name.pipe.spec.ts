import { CourseNamePipe } from './course-name.pipe';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { CourseService } from 'src/app/common/services/data/course.service';

// Transition shim for the 2026-08 Courses retirement: item text first,
// legacy courses/{id} lookup only for pre-flatten items. The service is
// duck-typed down to its one used method.
function courseServiceReturning(course: CourseModel | null): {
  service: CourseService;
  getByIdCached: jasmine.Spy;
} {
  const getByIdCached = jasmine.createSpy('getByIdCached').and.returnValue(Promise.resolve(course));
  return { service: { getByIdCached } as unknown as CourseService, getByIdCached };
}

const item = (fields: Partial<AgendaItem>): AgendaItem => fields as AgendaItem;

describe('CourseNamePipe', () => {
  it('returns the item\'s own text without any course lookup', async () => {
    const { service, getByIdCached } = courseServiceReturning({ title: 'Should not be read' } as CourseModel);
    const pipe = new CourseNamePipe(service);

    const result = await pipe.transform(item({ text: 'Discipleship 101', course: 'course-1' }));

    expect(result).toBe('Discipleship 101');
    expect(getByIdCached).not.toHaveBeenCalled();
  });

  it('falls back to the legacy course lookup for a pre-flatten item', async () => {
    const { service, getByIdCached } = courseServiceReturning({ title: 'Evangelism Workshop' } as CourseModel);
    const pipe = new CourseNamePipe(service);

    const result = await pipe.transform(item({ course: 'course-1' }));

    expect(getByIdCached).toHaveBeenCalledOnceWith('course-1');
    expect(result).toBe('Evangelism Workshop');
  });

  it('strips the legacy "Breakout: " prefix from a looked-up course title', async () => {
    const { service } = courseServiceReturning({ title: 'Breakout: Prayer Basics' } as CourseModel);
    const pipe = new CourseNamePipe(service);

    expect(await pipe.transform(item({ course: 'course-1' }))).toBe('Prayer Basics');
  });

  it('returns empty string when the legacy course doc no longer exists', async () => {
    const { service } = courseServiceReturning(null);
    const pipe = new CourseNamePipe(service);

    expect(await pipe.transform(item({ course: 'gone' }))).toBe('');
  });

  it('returns empty string, without a lookup, for an item with neither text nor course id', async () => {
    const { service, getByIdCached } = courseServiceReturning(null);
    const pipe = new CourseNamePipe(service);

    expect(await pipe.transform(item({}))).toBe('');
    expect(getByIdCached).not.toHaveBeenCalled();
  });

  it('returns empty string for a null/undefined item', async () => {
    const { service, getByIdCached } = courseServiceReturning(null);
    const pipe = new CourseNamePipe(service);

    expect(await pipe.transform(null)).toBe('');
    expect(await pipe.transform(undefined)).toBe('');
    expect(getByIdCached).not.toHaveBeenCalled();
  });
});
