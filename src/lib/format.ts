export function compact(n: number): string {
    if (n >= 1e9) {
        return `${(n / 1e9).toFixed(2)}B`;
    }
    if (n >= 1e6) {
        return `${(n / 1e6).toFixed(1)}M`;
    }
    if (n >= 1e3) {
        return `${(n / 1e3).toFixed(1)}K`;
    }
    return String(Math.round(n));
}

export function money(n: number): string {
    return `$${compact(n)}`;
}

export function moneyExact(n: number): string {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function intComma(n: number): string {
    return Math.round(n).toLocaleString('en-US');
}

export function bytesH(n: number): string {
    if (n >= 1e6) {
        return `${(n / 1e6).toFixed(1)} MB`;
    }
    if (n >= 1024) {
        return `${Math.round(n / 1024)} KB`;
    }
    return `${Math.round(n)} B`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(key: string): string {
    const m = /^(\d{4})-(\d{2})$/.exec(key);
    if (m) {
        return `${MONTHS[Number(m[2]) - 1]} ${m[1].slice(2)}`;
    }
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (d) {
        return `${MONTHS[Number(d[2]) - 1]} ${Number(d[3])}, ${d[1].slice(2)}`;
    }
    return key;
}

export function isoDay(t: number): string {
    return new Date(t).toISOString().slice(0, 10);
}

export function fmtSections(gs: number[]): string {
    return gs.length ? gs.map((g) => `g${g}`).join(', ') : '—';
}
