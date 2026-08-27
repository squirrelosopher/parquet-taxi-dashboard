import { Box, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

interface SectionHeadingProps {
    icon: ReactNode;
    label: string;
    aside?: ReactNode;
    right?: ReactNode;
}

export function SectionHeading({ icon, label, aside, right }: SectionHeadingProps) {
    return (
        <Group justify="space-between" align="center" wrap="wrap" mb="sm" gap="md">
            <Group gap={8} align="center">
                <Box c="dimmed" display="flex">{icon}</Box>
                <Text fw={600} fz="xs" tt="uppercase" lts={0.6}>{label}</Text>
                {aside}
            </Group>
            {right}
        </Group>
    );
}
