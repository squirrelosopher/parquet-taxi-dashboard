import { useEffect, useMemo, useState } from 'react';
import { Container, Stack, Text, Center, Loader } from '@mantine/core';
import { useCube, useView } from './hooks/useCube';
import { toggleValue } from './lib/filter';
import { toChartPoints } from './lib/series';
import type { Dimension, Filter } from './lib/types';
import { Brand } from './components/ui';
import { Hero } from './components/Hero';
import { ChartPanel } from './components/ChartPanel';
import { Kpis } from './components/Kpis';
import { Leaderboards } from './components/Leaderboards';
import { CubeSection } from './components/CubeSection';
import { DashboardFooter } from './components/DashboardFooter';

const CUBE_URL = `${import.meta.env.BASE_URL}cube.parquet.png`;
const EMPTY_TOTALS = { trips: 0, revenue: 0, avgFare: 0 };

export function App() {
    const { cube, error } = useCube(CUBE_URL);
    const [filter, setFilter] = useState<Filter>({});
    const [range, setRange] = useState({ d0: 0, d1: 0 });

    const fullRange = useMemo(() => {
        const d = cube?.daily ?? [];
        return d.length ? { d0: d[0].t, d1: d[d.length - 1].t } : { d0: 0, d1: 0 };
    }, [cube]);

    useEffect(() => setRange(fullRange), [fullRange]);

    const { view, loading } = useView(cube, filter, range);
    const chartData = useMemo(() => toChartPoints(view?.daily ?? []), [view]);

    const toggle = (dim: Dimension, value: string) =>
        setFilter((f) => ({ ...f, [dim]: toggleValue(f[dim], value) }));

    if (error) {
        return (
            <Center h="100vh"><Stack align="center" gap="xs">
                <Text c="red" fw={600}>Could not load data</Text>
                <Text size="sm" c="dimmed">{error}</Text>
            </Stack></Center>
        );
    }
    if (!cube) {
        return (
            <Center h="100vh"><Stack align="center" gap="sm">
                <Loader color="yellow" />
                <Text size="sm" c="dimmed">Reading the cube footer + overview…</Text>
            </Stack></Center>
        );
    }

    const totals = view?.totals ?? EMPTY_TOTALS;

    return (
        <Container size="md" py={32}>
            <Stack gap={28}>
                <Brand />
                <Hero sizeMb={(cube.totalBytes / 1e6).toFixed(1)} sectionCount={cube.sections.length} rowGroupCount={cube.groups.length} />

                <Stack className="alt-font" gap={28}>
                    <ChartPanel data={chartData} loading={loading} view={view} onWindow={(d0, d1) => setRange({ d0, d1 })} />
                    <Kpis totals={totals} />
                    <Leaderboards borough={view?.boroughLb ?? []} zone={view?.zoneLb ?? []} filter={filter} onToggle={toggle} />
                    <CubeSection sections={cube.sections} footerBytes={cube.footerBytes} />
                    <DashboardFooter />
                </Stack>
            </Stack>
        </Container>
    );
}
