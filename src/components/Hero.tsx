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
            <Title order={1} fz={{ base: 27, sm: 40 }} lh={1.05} maw={720} fw={700}>
                217&nbsp;million taxi trips,{' '}
                <Text span inherit c="yellow.7">read on demand.</Text>
            </Title>
            <Text c="dimmed" mt="md" maw={680} fz="md" lh={1.55}>
                Those trips are pre-aggregated into a single <b>{sizeMb}&nbsp;MB</b> Parquet file. Selecting a
                borough, a pickup zone, or a date range issues a byte-range request for only the rows that
                answer it, read in the browser with{' '}
                <Anchor href="https://github.com/hyparam/hyparquet" target="_blank" c="yellow.7" fw={700} inherit>hyparquet</Anchor>.
                No database, No API.
            </Text>
            <Group gap="xs" mt="xl">
                <Tag>217M trips</Tag>
                <Tag>2019 – 2023</Tag>
                <Tag>{sectionCount} grouping sets</Tag>
                <Tag>{rowGroupCount} row groups</Tag>
            </Group>
        </Box>
    );
}
