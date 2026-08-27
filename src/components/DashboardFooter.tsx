import { Divider, Text, Anchor } from '@mantine/core';

export function DashboardFooter() {
    return (
        <>
            <Divider />
            <Text size="xs" c="dimmed" lh={1.6}>
                NYC TLC Yellow Taxi records (2019–2023), pre-aggregated offline with DuckDB into one Parquet
                cube of grouping sets. The browser reads grouping-set rows on demand with hyparquet — no
                backend. Approach adapted from{' '}
                <Anchor href="https://www.hamiltonulmer.com/customer-dashboards-r2-hyparquet/" target="_blank" size="xs" c="dimmed" td="underline">
                    Hamilton Ulmer's backend-less dashboards
                </Anchor>.
            </Text>
        </>
    );
}
