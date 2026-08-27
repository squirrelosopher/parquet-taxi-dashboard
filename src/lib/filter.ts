// Toggle a value in a multi-select dimension; an empty set collapses to undefined.
export function toggleValue(values: string[] | undefined, v: string): string[] | undefined {
    const set = new Set(values);
    if (set.has(v)) {
        set.delete(v);
    } else {
        set.add(v);
    }
    return set.size ? Array.from(set) : undefined;
}
