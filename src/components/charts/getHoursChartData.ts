interface GetHoursChartDataProps {
  data: { hour: number; count: number }[];
}

interface GetSlicedHoursChartDataProps {
  data: { hour: string; count: number }[];
  hourToSliceBy: number;
}

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

const getSlicedHoursChartData = ({
  data,
  hourToSliceBy,
}: GetSlicedHoursChartDataProps) => {
  let firstIndex = hourToSliceBy - 6;
  let secondIndex = hourToSliceBy + 6;
  if (firstIndex < 0) {
    secondIndex += 0 - firstIndex;
    firstIndex = 0;
  } else if (secondIndex > 23) {
    firstIndex -= secondIndex - 23;
    secondIndex = 23;
  }

  return data.slice(firstIndex, secondIndex + 1);
};

const getHoursChartData = ({ data }: GetHoursChartDataProps) => {
  data.sort((a, b) => a.hour - b.hour);
  const hoursObj: { [key: string]: number } = {};
  data.forEach((item) => {
    const hourString = strHours[item.hour];
    hoursObj[hourString] = item.count;
  });

  const hoursChartData = strHours.map((hour) => {
    return {
      hour,
      count: hoursObj[hour] ?? 0,
    };
  });

  return hoursChartData;
};

export { getHoursChartData, getStrHour, getSlicedHoursChartData };
