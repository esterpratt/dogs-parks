import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import styles from './BarChart.module.scss';
import { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';
import { useModeContext } from '../../context/ModeContext';

interface BarChartProps {
  data: CategoricalChartProps['data'];
  xDataKey: string;
  yDataKey: string;
  currentHour: {
    hour: string | number;
    color: string;
  } | null;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  currentHour,
}) => {
  const mode = useModeContext((state) => state.mode);

  return (
    <ResponsiveContainer>
      <RechartsBarChart data={data} barGap="100%">
        <XAxis
          dataKey={xDataKey}
          tickMargin={10}
          interval="preserveStartEnd"
          tick={{ fill: styles.tickColor }}
          tickLine={{ fill: styles.tickColor }}
          axisLine={{ fill: styles.tickColor }}
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
          radius={[10, 10, 0, 0]}
          barSize={10}
        >
          {data?.map((entry, index) => {
            return (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.hour === currentHour?.hour
                    ? currentHour?.color
                    : mode === 'light'
                    ? styles.lightBlueLight
                    : styles.lightBlueDark
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
