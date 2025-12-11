import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

import 'dayjs/locale/en';
import 'dayjs/locale/he';
import 'dayjs/locale/ar';

dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(calendar);

dayjs.updateLocale('en', {
  calendar: {
    sameDay: '[Today at] HH:mm',
    nextDay: '[Tomorrow at] HH:mm',
    nextWeek: 'dddd [at] HH:mm',
    lastDay: '[Yesterday at] HH:mm',
    lastWeek: '[Last] dddd [at] HH:mm',
    sameElse: 'L [at] HH:mm',
  },
});

dayjs.updateLocale('he', {
  calendar: {
    sameDay: '[היום ב־]HH:mm',
    nextDay: '[מחר ב־]HH:mm',
    nextWeek: 'dddd [ב־]HH:mm',
    lastDay: '[אתמול ב־]HH:mm',
    lastWeek: '[ביום] dddd [ב־]HH:mm',
    sameElse: 'L [ב־]HH:mm',
  },
});

dayjs.updateLocale('ar', {
  calendar: {
    sameDay: '[اليوم في] HH:mm',
    nextDay: '[غدًا في] HH:mm',
    nextWeek: 'dddd [في] HH:mm',
    lastDay: '[أمس في] HH:mm',
    lastWeek: '[يوم] dddd [الماضي في] HH:mm',
    sameElse: 'L [في] HH:mm',
  },
});

export { dayjs };
