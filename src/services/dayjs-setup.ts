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

dayjs.updateLocale('he', {
  calendar: {
    sameDay: '[היום ב־]LT',
    nextDay: '[מחר ב־]LT',
    nextWeek: 'dddd [ב־]LT',
    lastDay: '[אתמול ב־]LT',
    lastWeek: '[ביום] dddd [ב־]LT',
    sameElse: 'L [ב־]LT',
  },
});

dayjs.updateLocale('ar', {
  calendar: {
    sameDay: '[اليوم في] LT',
    nextDay: '[غدًا في] LT',
    nextWeek: 'dddd [في] LT',
    lastDay: '[أمس في] LT',
    lastWeek: '[يوم] dddd [الماضي في] LT',
    sameElse: 'L [في] LT',
  },
});

export { dayjs };
