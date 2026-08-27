import { Text, Group, Stack } from '@mantine/core';
import type { LeaderRow } from '../lib/types';
import { intComma } from '../lib/format';

interface LeaderboardProps {
    title: string;
    rows: LeaderRow[];
    selected?: string[];
    onSelect: (key: string) => void;
    limit?: number;
}

export function Leaderboard({ title, rows, selected, onSelect, limit }: LeaderboardProps) {
    const picked = selected ?? [];

    // Keep a picked row visible even when it falls outside the top `limit`.
    const shown = limit ? rows.slice(0, limit) : rows;
    const extra = rows.filter((r) => picked.includes(r.key) && !shown.includes(r));
    const withSelected = extra.length ? [...shown, ...extra] : shown;

    // Bars fill relative to the leader, so the top row reads as full.
    const max = Math.max(1, ...withSelected.map((r) => r.trips));
    return (
        <div>
            <Text fz="xs" c="dimmed" tt="uppercase" fw={600} lts={0.6} mb="sm">{title}</Text>
            <Stack gap={2}>
                {withSelected.map((r) => {
                    const active = picked.includes(r.key);
                    const dimmed = picked.length > 0 && !active;
                    const pct = (r.trips / max) * 100;
                    return (
                        <div
                            key={r.key}
                            className="lb-row"
                            data-active={active}
                            data-dimmed={dimmed}
                            onClick={() => onSelect(r.key)}
                        >
                            <div className="lb-bar" style={{ width: `${pct}%` }} />
                            <Group justify="space-between" wrap="nowrap" w="100%" gap="sm" style={{ position: 'relative', zIndex: 1 }}>
                                <Text fz="sm" fw={active ? 700 : 500} truncate>{r.key}</Text>
                                <Text className="tnum" fz="sm" fw={active ? 600 : 400}>{intComma(r.trips)}</Text>
                            </Group>
                        </div>
                    );
                })}
            </Stack>
        </div>
    );
}
