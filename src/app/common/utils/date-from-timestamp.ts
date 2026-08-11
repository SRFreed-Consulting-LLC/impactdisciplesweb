import { fromUnixTime, isDate, isValid, parse } from 'date-fns';

export const dateFromTimestamp = (item) => {
  if (!item) {
    return null;
  }

  if (isDate(item)) {
    return item;
  }

  if (typeof item === 'string') {
    return parseStringDate(item);
  }

  let normalizedDate;

  if (item?.seconds) {
    normalizedDate = fromUnixTime(item.seconds);
  }

  return isValid(normalizedDate) ? normalizedDate : null;
};

const parseStringDate = (dateString: string): null | Date | string => {
  if (!dateString) {
    return null;
  }
  if (dateString.match(/dd\/dd\/dddd/)) {
    const date = parse(dateString, 'MM/dd/yyyy', new Date());
    return isValid(date) ? date : null;
  }
  return dateString;
};
