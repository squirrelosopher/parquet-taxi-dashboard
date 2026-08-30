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

    const shown = limit ? rows.slice(0, limit) : rows;
    const visible = new Set(shown.map((r) => r.key));
    // A pick the other dimension rules out has no row of its own. It is still filtering,
    // so it is listed at zero rather than left on with nothing to switch it off.
    const extra = picked
        .filter((key) => !visible.has(key))
        .map((key) => rows.find((r) => r.key === key) ?? { key, trips: 0, revenue: 0 });
    const withSelected = extra.length ? [...shown, ...extra] : shown;

    const max = Math.max(1, ...withSelected.map((r) => r.trips));
    return (
        <div>
            <Text fz={10} c="dimmed" tt="uppercase" fw={600} lts={0.6} mb="xs">{title}</Text>
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
                                <Text fz="xs" fw={active ? 700 : 500} truncate>{r.key}</Text>
                                <Text className="tnum" fz="xs" fw={active ? 600 : 400}>{intComma(r.trips)}</Text>
                            </Group>
                        </div>
                    );
                })}
            </Stack>
        </div>
    );
}
