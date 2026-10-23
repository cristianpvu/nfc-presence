import SearchSelect from './SearchSelect';
import { formatShortDate, formatTime } from '../format';

const courseLabel = course => `${course.name}, ${formatShortDate(course.startsAt)} ${formatTime(course.startsAt)}`;

export default function CourseSearch({ courses, onSelect }) {
  return (
    <SearchSelect
      items={courses}
      getLabel={courseLabel}
      placeholder="Toate cursurile"
      label="Curs"
      emptyText="Niciun curs găsit."
      onSelect={onSelect}
    />
  );
}
