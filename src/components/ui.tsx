import { Anchor, Badge, Group, Text, ThemeIcon } from '@mantine/core';
import { CarTaxiFront } from 'lucide-react';
import type { ReactNode } from 'react';

const GITHUB_URL = 'https://github.com/squirrelosopher/parquet-taxi-dashboard/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/squirrelosopher/';

const GITHUB_MARK =
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const LINKEDIN_MARK =
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z';

function SocialLink({ href, label, mark }: { href: string; label: string; mark: string }) {
    return (
        <Anchor href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="social-link">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={mark} />
            </svg>
        </Anchor>
    );
}

export function SocialLinks() {
    return (
        <Group gap={14} wrap="nowrap">
            <SocialLink href={GITHUB_URL} label="Source on GitHub" mark={GITHUB_MARK} />
            <SocialLink href={LINKEDIN_URL} label="LinkedIn profile" mark={LINKEDIN_MARK} />
        </Group>
    );
}

export function Brand() {
    return (
        <Group gap="xs" wrap="nowrap">
            <ThemeIcon size={32} radius="md" variant="filled" style={{ backgroundColor: 'var(--brand)', color: 'var(--paper)' }}>
                <CarTaxiFront size={18} strokeWidth={2.2} style={{ transform: 'translateY(0.75px)' }} />
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
                label: { overflow: 'visible', lineHeight: 1, display: 'inline-flex', alignItems: 'center', transform: 'translateY(1px)' },
                section: { marginRight: 7, display: 'inline-flex', alignItems: 'center' },
            }}
        >
            {children}
        </Badge>
    );
}

// One width for every stat, so the columns keep an even pitch and a changing
// value never reflows the row.
export function MiniStat({ label, value, w = 94 }: { label: string; value: string; w?: number }) {
    return (
        <div style={{ width: w, flex: 'none', textAlign: 'center' }}>
            <Text fz={9} c="dimmed" tt="uppercase" fw={600} lts={0.6} style={{ whiteSpace: 'nowrap' }}>
                {label}
            </Text>
            <Text className="tnum" fz="xs" fw={600} lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                {value}
            </Text>
        </div>
    );
}
