import { Box, Title, Text, Group, Anchor } from '@mantine/core';
import { Tag } from './ui';

interface HeroProps {
    sizeMb: string;
    sectionCount: number;
    rowGroupCount: number;
}

export function Hero({ sizeMb, sectionCount, rowGroupCount }: HeroProps) {
    return (
        <Box>
            <Title order={1} fz={{ base: 21, sm: 30 }} lh={1.1} maw={600} fw={700}>
                217&nbsp;million taxi trips,{' '}
                <Text span inherit c="yellow.7">read on demand.</Text>
            </Title>
            <Text c="dimmed" mt="sm" maw={580} fz="sm" lh={1.55}>
                Those trips are pre-aggregated into a single <b>{sizeMb}&nbsp;MB</b> Parquet file. Selecting a
                borough, a pickup zone, or a date range issues a byte-range request for only the rows that
                answer it, read in the browser with{' '}
                <Anchor href="https://github.com/hyparam/hyparquet/" target="_blank" c="yellow.7" fw={700} inherit>hyparquet</Anchor>.
                No database, No API.
            </Text>
            <Group gap={6} mt="lg">
                <Tag>217M trips</Tag>
                <Tag visibleFrom="sm">2019 – 2023</Tag>
                <Tag>{sectionCount} grouping sets</Tag>
                <Tag>{rowGroupCount} row groups</Tag>
            </Group>
        </Box>
    );
}
