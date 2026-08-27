import { Paper, SimpleGrid } from '@mantine/core';
import { Leaderboard } from './Leaderboard';
import type { Dimension, Filter, LeaderRow } from '../lib/types';

interface LeaderboardsProps {
    borough: LeaderRow[];
    zone: LeaderRow[];
    filter: Filter;
    onToggle: (dim: Dimension, value: string) => void;
}

export function Leaderboards({ borough, zone, filter, onToggle }: LeaderboardsProps) {
    return (
        <Paper withBorder radius="md" className="surface" p="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={32}>
                <Leaderboard title="By borough" rows={borough} selected={filter.borough} onSelect={(v) => onToggle('borough', v)} />
                <Leaderboard title="By pickup zone" rows={zone} selected={filter.zone} onSelect={(v) => onToggle('zone', v)} limit={12} />
            </SimpleGrid>
        </Paper>
    );
}
