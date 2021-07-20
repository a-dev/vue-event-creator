import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/es.js';
import 'dayjs/locale/ru.js';

const setDayJsLang = (lang: string) => {
  dayjs.locale(lang);
  dayjs.extend(localeData);

  dayjs.localeData();
};

const formatDate = (startsAt: Date, finishesAt: Date) => {
  let formattedDate;
  if (dayjs(startsAt).isSame(finishesAt, 'day')) {
    formattedDate = dayjs(startsAt).format('DD MMMM YYYY');
  } else if (dayjs(startsAt).isSame(finishesAt, 'month')) {
    formattedDate =
      dayjs(startsAt).format('DD–') + dayjs(finishesAt).format('DD MMMM YYYY');
  } else if (dayjs(startsAt).isSame(finishesAt, 'year')) {
    formattedDate =
      dayjs(startsAt).format('DD MMMM – ') +
      dayjs(finishesAt).format('DD MMMM YYYY');
  } else {
    formattedDate =
      dayjs(startsAt).format('DD MMMM YYYY – ') +
      dayjs(finishesAt).format('DD MMMM YYYY');
  }
  return formattedDate;
};

const formatTime = (startsAt: Date, finishesAt: Date) => {
  return (
    dayjs(startsAt).format('HH:mm') + '–' + dayjs(finishesAt).format('HH:mm')
  );
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
export {
  setDayJsLang,
  formatDate,
  formatTime,
  setTimeToDate,
  makeEsIdFromStartsAt
};
