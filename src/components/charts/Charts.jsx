import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar as RBar, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line,
} from 'recharts';
import { catMeta } from '../../data/constants';

const AXIS = { fontSize: 11, fill: '#94a3b8', fontWeight: 600 };

function TipBox({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white shadow-lg border border-slate-100 px-3 py-2">
      {label != null && <p className="text-[0.72rem] font-bold text-slate-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="text-[0.72rem] font-semibold flex items-center gap-1.5" style={{ color: p.color ?? p.payload?.fill }}>
          <i className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}{suffix}</b>
        </p>
      ))}
    </div>
  );
}

export function TrendArea({ data, keys = [
  { k: 'submitted', name: 'Challenges', c: '#06b6d4' },
  { k: 'validated', name: 'Validated', c: '#10b981' },
  { k: 'projects', name: 'Active projects', c: '#6366f1' },
  { k: 'completed', name: 'Completed', c: '#f59e0b' },
], height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.k} id={`g-${k.k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.c} stopOpacity={0.35} />
              <stop offset="100%" stopColor={k.c} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<TipBox />} />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} iconType="circle" iconSize={7} />
        {keys.map((k, i) => (
          <Area key={k.k} type="monotone" dataKey={k.k} name={k.name} stroke={k.c} strokeWidth={2.4}
            fill={`url(#g-${k.k})`} animationDuration={1200} animationBegin={i * 160} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data, height = 250, inner = 58, outer = 88 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={inner} outerRadius={outer}
          paddingAngle={3} cornerRadius={6} animationDuration={1100} stroke="none">
          {data.map((d) => <Cell key={d.name} fill={catMeta(d.name).hex} />)}
        </Pie>
        <Tooltip content={<TipBox />} />
        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={7}
          wrapperStyle={{ fontSize: 11, fontWeight: 600, lineHeight: '18px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, color = '#6366f1', height = 260, dataKey = 'count', nameKey = 'name', colorFn }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={nameKey} tick={AXIS} axisLine={false} tickLine={false} width={96} />
        <Tooltip content={<TipBox />} cursor={{ fill: '#f8fafc' }} />
        <RBar dataKey={dataKey} radius={[0, 7, 7, 0]} animationDuration={1000} barSize={14}>
          {data.map((d, i) => <Cell key={d[nameKey] ?? i} fill={colorFn ? colorFn(d) : color} />)}
        </RBar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({ data, color = '#6366f1', height = 220, dataKey = 'value', nameKey = 'name' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey={nameKey} tick={{ ...AXIS, fontSize: 9.5 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={54} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip content={<TipBox />} cursor={{ fill: '#f8fafc' }} />
        <RBar dataKey={dataKey} radius={[7, 7, 0, 0]} fill={color} animationDuration={1000} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FitRadar({ data, color = '#6366f1', height = 230 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e8edf5" />
        <PolarAngleAxis dataKey="axis" tick={{ ...AXIS, fontSize: 10 }} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.22} strokeWidth={2} animationDuration={1100} />
        <Tooltip content={<TipBox suffix="%" />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function MiniLine({ data, color = '#6366f1', dataKey = 'value', height = 90 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
        <Tooltip content={<TipBox />} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.4} dot={false} animationDuration={1100} />
      </LineChart>
    </ResponsiveContainer>
  );
}
