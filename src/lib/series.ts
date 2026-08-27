import type { DailyRow } from './cube';
import type { ChartPoint } from './types';
import { isoDay } from './format';

const SMOOTH_RADIUS = 3;

// A 7-day moving average, to take the weekday sawtooth out of the line.
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
