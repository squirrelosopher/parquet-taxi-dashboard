import { useState } from 'react';
import { Paper, Text, Group, Box, Stack } from '@mantine/core';
import type { Section } from '../lib/cube';
import { intComma, bytesH } from '../lib/format';

interface GroupingSetsProps {
    sections: Section[];
    footerBytes: number;
}

const FOOTER_G = 99;
const CUBE_COLUMN = 150;

interface SectionLine {
    section: number;
    count: number;
}
interface SinglesLine {
    singles: number[];
}
type Line = SectionLine | SinglesLine;

function toLines(sections: Section[]): Line[] {
    const lines: Line[] = [];
    let singles: number[] = [];
    const flush = () => {
        if (singles.length) {
            lines.push({ singles });
            singles = [];
        }
    };
    for (const s of sections) {
        if (s.rowGroups <= 1) {
            singles.push(s.g);
            continue;
        }
        flush();
        lines.push({ section: s.g, count: s.rowGroups });
    }
    flush();
    return lines;
}

export function GroupingSets({ sections, footerBytes }: GroupingSetsProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const maxBytes = Math.max(...sections.map((s) => s.bytes), footerBytes);
    const enter = (g: number) => () => setHovered(g);
    const leave = () => setHovered(null);

    return (
        <Group align="flex-start" gap={20} wrap="nowrap">
            <Box style={{ flex: 'none', width: CUBE_COLUMN }}>
                <Stack gap={5}>
                    {toLines(sections).map((line, i) => 'singles' in line ? (
                        <Group key={i} gap={2} wrap="wrap">
                            {line.singles.map((g) => (
                                <div key={g} className="gs-square" data-on={hovered === g} onMouseEnter={enter(g)} onMouseLeave={leave} />
                            ))}
                        </Group>
                    ) : (
                        <Group key={i} gap={2} wrap="wrap" onMouseEnter={enter(line.section)} onMouseLeave={leave}>
                            {Array.from({ length: line.count }, (_, j) => (
                                <div key={j} className="gs-square" data-on={hovered === line.section} />
                            ))}
                        </Group>
                    ))}
                </Stack>
                <div
                    className="gs-footer-bar"
                    style={{ width: '100%', marginTop: 12 }}
                    data-on={hovered === FOOTER_G}
                    onMouseEnter={enter(FOOTER_G)}
                    onMouseLeave={leave}
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
            <Box w={82} ta="right"><Text className="tnum" fz="xs" c={footer ? 'dimmed' : undefined}>{rows}</Text></Box>
            <Group w={124} gap="xs" wrap="nowrap">
                <div className="gs-bar-track" style={{ flex: 1 }}>
                    <div className="gs-bar-fill" style={{ width: `${(bytes / maxBytes) * 100}%`, background: footer ? 'var(--mantine-color-gray-4)' : undefined }} />
                </div>
                <Text className="tnum" fz={10} c="dimmed" w={46} ta="right">{bytesH(bytes)}</Text>
            </Group>
        </Group>
    );
}
