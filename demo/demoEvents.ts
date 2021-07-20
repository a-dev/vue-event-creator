import dayjs from 'dayjs';

const today = new Date();

export default [
  {
    id: 1,
    startsAt: dayjs(today).subtract(27, 'days').toDate(),
    finishesAt: dayjs(today).subtract(25, 'days').toDate(),
    data: {
      title: 'About a month ago',
      text: 'This happened 27 days ago and lasted for three days.'
    }
  },
  {
    id: 2,
    startsAt: dayjs(today).subtract(8, 'days').toDate(),
    finishesAt: dayjs(today).subtract(8, 'days').toDate(),
    data: {
      title: 'More than a week ago',
      text: 'It happened a week and one day ago.'
    }
  },
  {
    id: 3,
    startsAt: today,
    finishesAt: today,
    data: {
      title: 'Today',
      text: 'This is happening right now.'
    }
  },
  {
    id: 4,
    startsAt: dayjs(today).add(14, 'days'),
    finishesAt: dayjs(today).add(20, 'days'),
    data: {
      title: 'In two weeks',
      text: 'It will happen in two weeks and will last for a week.'
    }
  },
  {
    id: 5,
    startsAt: dayjs(today).add(29, 'days'),
    finishesAt: dayjs(today).add(29, 'days'),
    data: {
      title: 'In almost a month',
      text: 'This will happen in almost a month.'
    }
  }
];
