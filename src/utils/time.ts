import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const getFormattedPastDate = (date?: Date) => {
  if (!date) {
    return 'N/A';
  }

  const currentDayjs = dayjs();
  const dateDayjs = dayjs(date);
  const diff = currentDayjs.diff(dateDayjs, 'day');

  if (diff < 31) {
    return dateDayjs.fromNow();
  }

  return dateDayjs.format('DD/MM/YYYY');
};

const getFormattedDate = (date: Date) => {
  const dateDayjs = dayjs(date);
  return dateDayjs.format('YYYY-MM-DD');
};

const getAge = (birthday: Date) => {
  const currentDayjs = dayjs();
  const dateDayjs = dayjs(birthday);
  let diff = currentDayjs.diff(dateDayjs, 'year');
  let unit = diff === 1 ? 'year' : 'years';

  if (diff === 0) {
    diff = currentDayjs.diff(dateDayjs, 'month');
    unit = diff === 1 ? 'month' : 'months';
  }

  return {
    diff,
    unit,
  };
};

export { getFormattedPastDate, getFormattedDate, getAge };
