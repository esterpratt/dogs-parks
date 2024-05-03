import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import styles from './BarChart.module.scss';
import { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';

interface BarChartProps {
  data: CategoricalChartProps['data'];
  xDataKey: string;
  yDataKey: string;
  currentHour: {
    hour: string | number;
    color: string;
  };
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  currentHour,
}) => {
  return (
    <ResponsiveContainer>
      <RechartsBarChart data={data}>
        <XAxis
          dataKey={xDataKey}
          tickMargin={10}
          interval="preserveStartEnd"
          ticks={[
            '00:00',
            '3:00',
            '6:00',
            '9:00',
            '12:00',
            '15:00',
            '18:00',
            '21:00',
          ]}
        />
        <Bar
          dataKey={yDataKey}
          fill={styles.blue}
          radius={[10, 10, 10, 10]}
          barSize={10}
        >
          {data?.map((entry, index) => {
            return (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.hour === currentHour.hour
                    ? currentHour.color
                    : styles.grey
                }
              />
            );
          })}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export { BarChart };
