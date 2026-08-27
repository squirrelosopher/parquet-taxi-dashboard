// A cross-filter selection. Each dimension holds a set of picked values (the
// leaderboards are multi-select); an absent/empty array means "no filter".
export interface Filter {
    borough?: string[];
    zone?: string[];
}

export type Dimension = keyof Filter;

export interface LeaderRow {
    key: string;
    trips: number;
    revenue: number;
}

export interface Totals {
    trips: number;
    revenue: number;
    avgFare: number;
}

export interface ChartPoint {
    label: string; // YYYY-MM-DD
    trips: number;
    t: number;
}
