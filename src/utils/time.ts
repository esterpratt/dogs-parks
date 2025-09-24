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
    let relative = dateDayjs.subtract(1, 'second').fromNow();
    // Hebrew dual-form normalization (only when current locale is Hebrew)
    // Day.js sometimes outputs 'לפני 2 ימים/שעות/שבועות'. Desired: 'לפני יומיים/שעתיים/שבועיים'.
    if (dayjs.locale() === 'he') {
      relative = relative
        .replace('לפני 2 ימים', 'לפני יומיים')
        .replace('לפני 2 יום', 'לפני יומיים')
        .replace('לפני 2 שעות', 'לפני שעתיים')
        .replace('לפני 2 שעה', 'לפני שעתיים')
        .replace('לפני 2 שבועות', 'לפני שבועיים')
        .replace('לפני 2 שבוע', 'לפני שבועיים');
    }
    return relative;
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
