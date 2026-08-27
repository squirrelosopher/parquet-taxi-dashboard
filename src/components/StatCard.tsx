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
        <Paper withBorder p="md" radius="md" className="surface">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text fz={10} c="dimmed" tt="uppercase" fw={600} lts={0.6}>
                        {label}
                    </Text>
                    <Text className="tnum" fz={21} fw={700} lh={1.05} mt={4}>
                        {value}
                    </Text>
                    {sub && (
                        <Text className="tnum" fz={10} c="dimmed" mt={3}>
                            {sub}
                        </Text>
                    )}
                </div>
                <ThemeIcon variant="light" color={color} size={30} radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Paper>
    );
}
