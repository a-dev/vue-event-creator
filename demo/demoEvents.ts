import dayjs from 'dayjs';

export const E2E_REFERENCE_DATE = new Date('2026-09-01T10:00:00.000Z');

export const createDemoEvents = (referenceDate: Date = new Date()) => [
  {
    id: 1,
    startsAt: dayjs(referenceDate).subtract(27, 'days').toDate(),
    finishesAt: dayjs(referenceDate).subtract(25, 'days').toDate(),
    data: {
      title: 'About a month ago',
      text: 'This happened 27 days ago and lasted for three days.',
    },
  },
  {
    id: 2,
    startsAt: dayjs(referenceDate).subtract(8, 'days').toDate(),
    finishesAt: dayjs(referenceDate).subtract(8, 'days').toDate(),
    data: {
      title: 'More than a week ago',
      text: 'It happened a week and one day ago.',
    },
  },
  {
    id: 3,
    startsAt: new Date(referenceDate),
    finishesAt: new Date(referenceDate),
    data: {
      title: 'Today',
      text: 'This is happening right now.',
    },
  },
  {
    id: 4,
    startsAt: dayjs(referenceDate).add(14, 'days').toDate(),
    finishesAt: dayjs(referenceDate).add(20, 'days').toDate(),
    data: {
      title: 'In two weeks',
      text: 'It will happen in two weeks and will last for a week.',
    },
  },
  {
    id: 5,
    startsAt: dayjs(referenceDate).add(29, 'days').toDate(),
    finishesAt: dayjs(referenceDate).add(29, 'days').toDate(),
    data: {
      title: 'In almost a month',
      text: 'This will happen in almost a month.',
    },
  },
];

export default createDemoEvents;
