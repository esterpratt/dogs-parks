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
    // a solution for a bug where sometimes it returned 'in a few seconds' instead of 'a few seconds ago'
    return dateDayjs.subtract(1, 'second').fromNow();
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

const getDurationFromNow = (ms: number) => {
  const now = new Date();
  const timeFromNow = new Date(Date.now() + ms);
  return dayjs(now).to(timeFromNow, true);
};

export { getFormattedPastDate, getFormattedDate, getAge, getDurationFromNow };
