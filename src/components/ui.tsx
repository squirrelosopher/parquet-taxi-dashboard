import { Badge, Group, Text, ThemeIcon } from '@mantine/core';
import { Car } from 'lucide-react';
import type { ReactNode } from 'react';

export function Brand() {
    return (
        <Group gap="xs" wrap="nowrap">
            <ThemeIcon size={32} radius="md" variant="filled" style={{ backgroundColor: 'var(--brand)', color: 'var(--paper)' }}>
                <Car size={18} strokeWidth={2.2} />
            </ThemeIcon>
            <div>
                <Text fw={700} fz="sm" lh={1.1}>NYC Yellow Taxi</Text>
                <Text fz={9} c="dimmed" tt="uppercase" fw={600} lts={1}>trip analytics</Text>
            </div>
        </Group>
    );
}

export function Tag({ icon, children, color = 'gray' }: { icon?: ReactNode; children: ReactNode; color?: string }) {
    return (
        <Badge
            variant="light"
            color={color}
            radius="sm"
            leftSection={icon}
            styles={{
                root: {
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: 0.4,
                },
                // Caps sit high in the line box; nudge down 1px to centre against the icon.
                label: { overflow: 'visible', lineHeight: 1, display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' },
                section: { marginRight: 7, display: 'inline-flex', alignItems: 'center' },
            }}
        >
            {children}
        </Badge>
    );
}

// Fixed width so a changing value never reflows the row.
export function MiniStat({ label, value, w = 64 }: { label: string; value: string; w?: number }) {
    return (
        <div style={{ width: w, flex: 'none' }}>
            <Text fz={9} c="dimmed" tt="uppercase" fw={600} lts={0.6} style={{ whiteSpace: 'nowrap' }}>
                {label}
            </Text>
            <Text className="tnum" fz="xs" fw={600} lh={1.2}>
                {value}
            </Text>
        </div>
    );
}
