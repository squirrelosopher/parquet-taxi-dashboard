import { useState } from 'react';
import { Paper, Text, Group, Box } from '@mantine/core';
import type { Section } from '../lib/cube';
import { intComma, bytesH } from '../lib/format';

interface GroupingSetsProps {
    sections: Section[];
    groupCount: number;
    footerBytes: number;
}

const FOOTER_G = 99;

export function GroupingSets({ sections, groupCount, footerBytes }: GroupingSetsProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const maxBytes = Math.max(...sections.map((s) => s.bytes), footerBytes);

    // Every square is one row group in the file. A row group that straddles a
    // boundary belongs to both sections, and lights up for either.
    const lit = sections.find((s) => s.g === hovered);

    return (
        <Group align="flex-start" gap={20} wrap="nowrap">
            <Box className="gs-cubes">
                <Group gap={2} wrap="wrap">
                    {Array.from({ length: groupCount }, (_, i) => (
                        <div key={i} className="gs-square" data-on={!!lit && i >= lit.firstGroup && i <= lit.lastGroup} />
                    ))}
                </Group>
                <div
                    className="gs-footer-bar"
                    style={{ width: '100%', marginTop: 12 }}
                    data-on={hovered === FOOTER_G}
                    onMouseEnter={() => setHovered(FOOTER_G)}
                    onMouseLeave={() => setHovered(null)}
                />
            </Box>

            <Paper withBorder radius="md" className="surface" p={0} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {sections.map((s, i) => (
                    <SectionRow
                        key={s.g} g={s.g} label={s.label} rows={intComma(s.rows)} bytes={s.bytes} maxBytes={maxBytes}
                        first={i === 0} hovered={hovered} setHovered={setHovered}
                    />
                ))}
                <SectionRow
                    g={FOOTER_G} label="footer index" rows="—" bytes={footerBytes} maxBytes={maxBytes} footer
                    first={false} hovered={hovered} setHovered={setHovered}
                />
            </Paper>
        </Group>
    );
}

interface SectionRowProps {
    g: number;
    label: string;
    rows: string;
    bytes: number;
    maxBytes: number;
    first: boolean;
    footer?: boolean;
    hovered: number | null;
    setHovered: (g: number | null) => void;
}

function SectionRow({ g, label, rows, bytes, maxBytes, first, footer, hovered, setHovered }: SectionRowProps) {
    return (
        <Group
            className="gs-row"
            data-hover={hovered === g}
            wrap="nowrap"
            gap="md"
            px="md"
            py={6}
            style={{ borderTop: first ? undefined : `1px solid var(--mantine-color-gray-${footer ? 2 : 1})` }}
            onMouseEnter={() => setHovered(g)}
            onMouseLeave={() => setHovered(null)}
        >
            <Text fw={500} fz="xs" style={{ flex: 1, minWidth: 0 }}>
                {footer ? label : <><Text span c="dimmed" fw={500} fz={10} className="tnum">(g{g})</Text> {label}</>}
            </Text>
            <Box className="gs-count" ta="right"><Text className="tnum" fz="xs" c={footer ? 'dimmed' : undefined}>{rows}</Text></Box>
            <Group className="gs-bytes" gap="xs" wrap="nowrap">
                <div className="gs-bar-track" style={{ flex: 1 }}>
                    <div className="gs-bar-fill" style={{ width: `${(bytes / maxBytes) * 100}%`, background: footer ? 'var(--mantine-color-gray-4)' : undefined }} />
                </div>
                <Text className="tnum" fz={10} c="dimmed" w={46} ta="right">{bytesH(bytes)}</Text>
            </Group>
        </Group>
    );
}
