import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../utils/helpers';

/**
 * Dashboard and report charts.
 * One shared look: thin marks, rounded bar ends, a quiet grid, and tooltips on
 * every chart. The palette was checked for colour-blind separation and contrast.
 */
export const CHART_COLORS = {
  gold: '#B8860B',
  blue: '#2563EB',
  green: '#15803D',
  red: '#DC2626',
  purple: '#7C3AED',
};

const AXIS = { fontSize: 12, fill: '#6b7280' };
const GRID = '#eef0f2';

/** Card frame with a title and optional subtitle. */
export const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <section className={`card ${className}`}>
    <h2 className="font-semibold text-gray-900 font-sans">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const TooltipBox = ({ active, payload, label, labelFormatter, valueFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-sm">
      <p className="font-medium text-gray-900 mb-1">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color || entry.payload?.fill }} />
          {entry.name}: <span className="font-semibold text-gray-900">{valueFormatter ? valueFormatter(entry.value) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ height }) => (
  <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>No data for this period yet</div>
);

/** Revenue over time. `data` = [{ [xKey], revenue }]. */
export const RevenueChart = ({ data, xKey = 'date', dateAxis = true, height = 280 }) => {
  if (!data?.some((point) => point.revenue > 0)) return <EmptyChart height={height} />;
  // `dateAxis` means the x values are "YYYY-MM-DD" strings that should be formatted as dates.
  const isDaily = dateAxis;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.gold} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.gold} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          tickFormatter={(value) => (isDaily ? format(parseISO(value), 'd MMM') : value)}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => formatCurrency(value, { compact: true })} />
        <Tooltip
          cursor={{ stroke: '#9ca3af', strokeDasharray: '4 4' }}
          content={<TooltipBox valueFormatter={formatCurrency} labelFormatter={(value) => (isDaily ? format(parseISO(value), 'EEE, d MMM yyyy') : value)} />}
        />
        <Area type="linear" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.gold} strokeWidth={2} fill="url(#revenueFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const STATUS_COLORS = {
  Pending: CHART_COLORS.gold,
  Confirmed: CHART_COLORS.blue,
  Completed: CHART_COLORS.green,
  Cancelled: CHART_COLORS.red,
  'No-show': CHART_COLORS.purple,
};

/** Bookings by status. Every bar is labelled, so colour is never the only cue. */
export const BookingStatusChart = ({ data, height = 280 }) => {
  if (!data?.some((row) => row.count > 0)) return <EmptyChart height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={12}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="status" tick={AXIS} tickLine={false} axisLine={false} width={82} />
        <Tooltip cursor={{ fill: '#f9fafb' }} content={<TooltipBox />} />
        <Bar dataKey="count" name="Bookings" radius={[0, 4, 4, 0]} maxBarSize={26}>
          {data.map((row) => <Cell key={row.status} fill={STATUS_COLORS[row.status]} />)}
          <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Monthly bookings split into completed and cancelled. */
export const BookingTrendChart = ({ data, height = 280 }) => {
  if (!data?.some((row) => row.total > 0)) return <EmptyChart height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} minTickGap={12} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <Tooltip cursor={{ fill: '#f9fafb' }} content={<TooltipBox />} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: '#374151' }} />
        <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="cancelled" name="Cancelled / no-show" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Running total of registered customers by month. */
export const CustomerGrowthChart = ({ data, height = 280 }) => {
  if (!data?.some((row) => row.totalCustomers > 0)) return <EmptyChart height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} minTickGap={12} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <Tooltip cursor={{ stroke: '#9ca3af', strokeDasharray: '4 4' }} content={<TooltipBox />} />
        <Line type="monotone" dataKey="totalCustomers" name="Total customers" stroke={CHART_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/** Ranked horizontal bars (popular services, stylist performance). */
export const RankingChart = ({ data, dataKey = 'bookings', name = 'Bookings', color = CHART_COLORS.gold, valueFormatter, height = 280 }) => {
  if (!data?.length) return <EmptyChart height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={130} tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)} />
        <Tooltip cursor={{ fill: '#f9fafb' }} content={<TooltipBox valueFormatter={valueFormatter} />} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey={dataKey} position="right" formatter={valueFormatter} style={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
