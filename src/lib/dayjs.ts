import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/es.js';
import 'dayjs/locale/ru.js';

dayjs.extend(localeData);

/**
 * Formats a date range in `locale` without touching the Day.js global locale,
 * so instances with different `language` props never interfere.
 */
const formatDate = (startsAt: Date, finishesAt: Date, locale = 'en') => {
  const localizedStart = dayjs(startsAt).locale(locale);
  const localizedFinish = dayjs(finishesAt).locale(locale);
  let formattedDate;
  if (localizedStart.isSame(localizedFinish, 'day')) {
    formattedDate = localizedStart.format('DD MMMM YYYY');
  } else if (localizedStart.isSame(localizedFinish, 'month')) {
    formattedDate =
      localizedStart.format('DD–') + localizedFinish.format('DD MMMM YYYY');
  } else if (localizedStart.isSame(localizedFinish, 'year')) {
    formattedDate =
      localizedStart.format('DD MMMM – ') +
      localizedFinish.format('DD MMMM YYYY');
  } else {
    formattedDate =
      localizedStart.format('DD MMMM YYYY – ') +
      localizedFinish.format('DD MMMM YYYY');
  }
  return formattedDate;
};

const makeEsIdFromStartsAt = (startsAt: Date) => {
  return +dayjs(startsAt).format('YYYYMMDD');
};

const setTimeToDate = (date: Date, hm: string) => {
  const hmArray = hm.split(':');
  return dayjs(date)
    .set('hour', +hmArray[0])
    .set('minute', +hmArray[1])
    .toDate();
};

export default dayjs;
export { formatDate, setTimeToDate, makeEsIdFromStartsAt };
