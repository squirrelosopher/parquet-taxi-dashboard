import { Box, Paper, Loader } from '@mantine/core';
import { TrendingUp } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { FetchStats } from './FetchStats';
import { TripsChart } from './TripsChart';
import type { ChartPoint } from '../lib/types';
import type { ViewResult } from '../lib/cube';

interface ChartPanelProps {
    data: ChartPoint[];
    loading: boolean;
    view: ViewResult | null;
    onWindow: (d0: number, d1: number) => void;
}

export function ChartPanel({ data, loading, view, onWindow }: ChartPanelProps) {
    return (
        <Box>
            <SectionHeading
                icon={<TrendingUp size={16} />}
                label="Daily trips — drag to select a range"
                aside={loading && <Loader size="xs" color="yellow" />}
                right={<FetchStats view={view} />}
            />
            <Paper withBorder p="lg" radius="md" className="surface">
                <TripsChart data={data} onWindow={onWindow} />
            </Paper>
        </Box>
    );
}
