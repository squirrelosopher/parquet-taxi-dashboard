import { useMemo, useState } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
} from 'recharts';
import { compact, monthLabel } from '../lib/format';
import type { ChartPoint } from '../lib/types';

interface TripsChartProps {
    data: ChartPoint[];
    onWindow: (d0: number, d1: number) => void;
}

interface MouseState {
    activeLabel?: string;
}

export function TripsChart({ data, onWindow }: TripsChartProps) {
    const { toT, toIdx } = useMemo(() => {
        const t = new Map<string, number>();
        const idx = new Map<string, number>();
        data.forEach((p, i) => {
            t.set(p.label, p.t);
            idx.set(p.label, i);
        });
        return { toT: t, toIdx: idx };
    }, [data]);

    const [dragL, setDragL] = useState<string | null>(null);
    const [dragR, setDragR] = useState<string | null>(null);
    const [selecting, setSelecting] = useState(false);
    const [committed, setCommitted] = useState<[string, string] | null>(null);

    const down = (e: MouseState | null) => {
        if (!e?.activeLabel) {
            return;
        }
        setSelecting(true);
        setDragL(e.activeLabel);
        setDragR(e.activeLabel);
    };
    const move = (e: MouseState | null) => {
        if (selecting && e?.activeLabel) {
            setDragR(e.activeLabel);
        }
    };
    const up = () => {
        setSelecting(false);
        const a = dragL;
        const b = dragR;
        setDragL(null);
        setDragR(null);
        if (!a) {
            return;
        }
        if (!b || a === b) {
            setCommitted(null);
            onWindow(data[0].t, data[data.length - 1].t);
            return;
        }
        let lo = a;
        let hi = b;
        if ((toIdx.get(lo) ?? 0) > (toIdx.get(hi) ?? 0)) {
            [lo, hi] = [hi, lo];
        }
        setCommitted([lo, hi]);
        onWindow(toT.get(lo) as number, toT.get(hi) as number);
    };

    const firstLabel = data[0]?.label;
    const lastLabel = data[data.length - 1]?.label;
    let selLo = dragL;
    let selHi = dragR;
    if (dragL && dragR && (toIdx.get(dragL) ?? 0) > (toIdx.get(dragR) ?? 0)) {
        [selLo, selHi] = [dragR, dragL];
    }

    const active = selecting ? (selLo && selHi ? [selLo, selHi] : null) : committed;

    return (
        <div className="trips-chart" style={{ userSelect: 'none' }}>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={() => selecting && up()}>
                    <defs>
                        <linearGradient id="trips" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--mantine-color-yellow-6)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="var(--mantine-color-yellow-6)" stopOpacity={0.04} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--mantine-color-default-border)" />
                    <XAxis
                        dataKey="label"
                        tickFormatter={monthLabel}
                        minTickGap={60}
                        tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--mantine-color-default-border)' }}
                    />
                    <YAxis
                        tickFormatter={compact}
                        width={38}
                        tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        formatter={(v: number) => [Number(v).toLocaleString('en-US'), 'trips/day']}
                        labelFormatter={(l: string) => monthLabel(l)}
                        contentStyle={{ background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-default-border)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="trips" stroke="var(--mantine-color-yellow-6)" strokeWidth={2.5} fill="url(#trips)" isAnimationActive={false} />
                    {active && (
                        <>
                            <ReferenceArea x1={firstLabel} x2={active[0]} fill="var(--surface)" fillOpacity={0.68} />
                            <ReferenceArea x1={active[1]} x2={lastLabel} fill="var(--surface)" fillOpacity={0.68} />
                        </>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
