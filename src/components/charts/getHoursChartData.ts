type GetHoursChartDataProps = {
  hour: number;
  count: number;
  weekday: string;
  fullDate: string;
}[];

const strHours = [
  '00:00',
  '1:00',
  '2:00',
  '3:00',
  '4:00',
  '5:00',
  '6:00',
  '7:00',
  '8:00',
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

const getStrHour = (hour: number) => {
  return strHours[hour];
};

const getHoursChartData = (data: GetHoursChartDataProps) => {
  // arrange data for calculation
  const countByDateAndHour: {
    [hour: number]: { [date: string]: { count: number; occurances: number } };
  } = {};

  data.forEach((item) => {
    if (!countByDateAndHour[item.hour]) {
      countByDateAndHour[item.hour] = {
        [item.fullDate]: {
          count: item.count,
          occurances: 1,
        },
      };
    } else {
      if (!countByDateAndHour[item.hour][item.fullDate]) {
        countByDateAndHour[item.hour][item.fullDate] = {
          count: item.count,
          occurances: 1,
        };
      } else {
        countByDateAndHour[item.hour][item.fullDate].count += item.count;
        countByDateAndHour[item.hour][item.fullDate].occurances += 1;
      }
    }
  });

  // get average for every hour
  const countByHour: { [hour: string]: number } = {};
  Object.keys(countByDateAndHour).forEach((hour) => {
    const dateAvg: { [date: string]: number } = {};
    Object.keys(countByDateAndHour[Number(hour)]).forEach((date) => {
      dateAvg[date] =
        countByDateAndHour[Number(hour)][date].count /
        countByDateAndHour[Number(hour)][date].occurances;
    });
    const sum = Object.keys(dateAvg).reduce((acc, date) => {
      return acc + dateAvg[date];
    }, 0);
    const avg = Math.round(sum / Object.keys(dateAvg).length);
    const strHour = getStrHour(Number(hour));
    countByHour[strHour] = avg;
  });

  // get data arrange by hour for the chart
  return strHours.map((hour) => {
    return {
      hour,
      count: countByHour[hour] || 0,
    };
  });
};

export { getHoursChartData, getStrHour };
