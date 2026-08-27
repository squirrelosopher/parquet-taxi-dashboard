import { useEffect, useRef, useState } from 'react';
import { openCube, readView, type Cube, type ViewResult } from '../lib/cube';
import type { Filter } from '../lib/types';

export function useCube(url: string): { cube: Cube | null; error: string | null } {
    const [cube, setCube] = useState<Cube | null>(null);
    const [error, setError] = useState<string | null>(null);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) {
            return;
        }
        started.current = true;
        openCube(url)
            .then(setCube)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    }, [url]);

    return { cube, error };
}

interface DateRange {
    d0: number;
    d1: number;
}

export function useView(cube: Cube | null, filter: Filter, range: DateRange): { view: ViewResult | null; loading: boolean } {
    const [view, setView] = useState<ViewResult | null>(null);
    const [loading, setLoading] = useState(false);
    const latest = useRef(0);

    useEffect(() => {
        if (!cube || !range.d1) {
            return;
        }
        const id = ++latest.current;
        setLoading(true);
        readView(cube, filter, range.d0, range.d1)
            .then((v) => {
                if (id === latest.current) {
                    setView(v);
                }
            })
            .finally(() => {
                if (id === latest.current) {
                    setLoading(false);
                }
            });
    }, [cube, filter, range]);

    return { view, loading };
}
