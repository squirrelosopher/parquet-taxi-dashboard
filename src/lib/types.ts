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
    label: string;
    trips: number;
    t: number;
}
