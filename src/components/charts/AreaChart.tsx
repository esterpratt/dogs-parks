import {
  Area,
  AreaChart as RechartAreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
        <XAxis dataKey={xDataKey} />
        <YAxis dataKey={yDataKey} domain={[0, 'dataMax + 2']} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area
          type="basis"
          dataKey={yDataKey}
          fillOpacity={0.8}
          fill="url(#fillColor)"
          stroke="#578796"
          strokeWidth={0.5}
        />
        {!!referecnceLineData && (
          <ReferenceLine x={referecnceLineData} stroke="#578796" />
        )}
      </RechartAreaChart>
    </ResponsiveContainer>
  );
};

export { AreaChart };
