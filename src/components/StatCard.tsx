import { Paper, Text, Group, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: ReactNode;
    color?: string;
}

export function StatCard({ label, value, sub, icon, color = 'gray' }: StatCardProps) {
    return (
        <Paper withBorder p="lg" radius="md" className="surface">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.6}>
                        {label}
                    </Text>
                    <Text className="tnum" fz={25} fw={700} lh={1.05} mt={6}>
                        {value}
                    </Text>
                    {sub && (
                        <Text className="tnum" size="xs" c="dimmed" mt={6}>
                            {sub}
                        </Text>
                    )}
                </div>
                <ThemeIcon variant="light" color={color} size={38} radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Paper>
    );
}
