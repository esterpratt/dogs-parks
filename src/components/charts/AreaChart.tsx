import {
  Area,
  AreaChart as RechartAreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';

interface AreaChartProps {
  data: CategoricalChartProps['data'];
  xDataKey: string;
  yDataKey: string;
  referecnceLineData?: string | number;
}

const AreaChart = ({
  data,
  xDataKey,
  yDataKey,
  referecnceLineData,
}: AreaChartProps) => {
  return (
    <ResponsiveContainer>
      <RechartAreaChart data={data}>
        <defs>
          <linearGradient id="fillColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="30%" stopColor="#fb564c" stopOpacity={0.9} />
            <stop offset="60%" stopColor="#ecac52" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#9ac457" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xDataKey} interval="preserveStartEnd" tickSize={6} />
        <CartesianGrid strokeDasharray="5 5" stroke="#ebebeb" />
        <Tooltip />
        <Area
          type="basis"
          dataKey={yDataKey}
          fillOpacity={0.6}
          fill="url(#fillColor)"
          stroke="#ebebeb"
          strokeWidth={0.5}
        />
        {!!referecnceLineData && (
          <ReferenceLine
            x={referecnceLineData}
            stroke="#4d4d4d"
            strokeWidth={1.5}
            strokeDasharray={2}
            strokeOpacity={0.5}
          />
        )}
      </RechartAreaChart>
    </ResponsiveContainer>
  );
};

export { AreaChart };
