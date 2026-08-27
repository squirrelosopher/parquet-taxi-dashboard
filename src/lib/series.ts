import type { DailyRow } from './cube';
import type { ChartPoint } from './types';
import { isoDay } from './format';

const SMOOTH_RADIUS = 3; // ±3 days → a 7-day moving average

// Smooth out weekday noise so the long-run shape reads clearly.
export function toChartPoints(daily: DailyRow[]): ChartPoint[] {
    return daily.map((row, i) => {
        const lo = Math.max(0, i - SMOOTH_RADIUS);
        const hi = Math.min(daily.length - 1, i + SMOOTH_RADIUS);
        let sum = 0;
        for (let j = lo; j <= hi; j++) {
            sum += daily[j].trips;
        }
        return { label: isoDay(row.t), trips: Math.round(sum / (hi - lo + 1)), t: row.t };
    });
}
