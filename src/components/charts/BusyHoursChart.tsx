import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { BarChart } from './BarChart';
import styles from './BusyHoursChart.module.scss';

interface Data {
  hour: string;
  count: number;
}

interface BusyHoursChartProps {
  fullData?: Data[];
  weekendData?: Data[];
  weekdaysData?: Data[];
  currHour: string;
  isWeekend: boolean;
  business: {
    str: string;
    className: string;
    color: string;
  };
}

const WEEKEND = 'weekend';
const WEEKDAYS = 'weekdays';

const BusyHoursChart = (props: BusyHoursChartProps) => {
  const { fullData, weekdaysData, weekendData, currHour, isWeekend, business } =
    props;
  const [activeTab, setActiveTab] = useState(WEEKDAYS);

  const activeData = fullData
    ? fullData
    : activeTab === WEEKDAYS
    ? weekdaysData
    : weekendData;

  useEffect(() => {
    setActiveTab(isWeekend ? WEEKEND : WEEKDAYS);
  }, [isWeekend]);

  return (
    <div className={styles.chartsContainer}>
      {!fullData && (
        <div className={styles.tabsContainer}>
          <button
            className={classnames(styles.tab, {
              [styles.active]: activeTab === WEEKDAYS,
            })}
            onClick={() => setActiveTab(WEEKDAYS)}
          >
            Weekdays
          </button>
          <button
            className={classnames(styles.tab, {
              [styles.active]: activeTab === WEEKEND,
            })}
            onClick={() => setActiveTab(WEEKEND)}
          >
            Weekends
          </button>
        </div>
      )}
      <div className={styles.chartContainer}>
        <BarChart
          data={activeData}
          xDataKey="hour"
          yDataKey="count"
          currentHour={{ hour: currHour, color: business.color }}
        />
      </div>
    </div>
  );
};

export { BusyHoursChart };
