import { Box, Paper, Loader, Text } from '@mantine/core';
import { TrendingUp } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { FetchStats } from './FetchStats';
import { TripsChart } from './TripsChart';
import type { ChartPoint } from '../lib/types';
import type { ViewResult } from '../lib/cube';

interface ChartPanelProps {
    data: ChartPoint[];
    loading: boolean;
    /** A read that did not arrive: the figures below answer the previous selection. */
    failed: boolean;
    view: ViewResult | null;
    onWindow: (d0: number, d1: number) => void;
}

export function ChartPanel({ data, loading, failed, view, onWindow }: ChartPanelProps) {
    return (
        <Box>
            <SectionHeading
                icon={<TrendingUp size={14} />}
                label="Daily trips — drag to select a range"
                aside={loading && <Loader size="xs" color="yellow" />}
                right={failed ? <Text fz={10} c="red" fw={600} tt="uppercase" lts={0.6}>Could not read — figures are stale</Text> : <FetchStats view={view} />}
            />
            <Paper withBorder p="md" radius="md" className="surface">
                <TripsChart data={data} onWindow={onWindow} />
            </Paper>
        </Box>
    );
}
