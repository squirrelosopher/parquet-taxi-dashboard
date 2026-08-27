import { SimpleGrid } from '@mantine/core';
import { Route, DollarSign, Wallet } from 'lucide-react';
import { StatCard } from './StatCard';
import { compact, money, moneyExact, intComma } from '../lib/format';
import type { Totals } from '../lib/types';

export function Kpis({ totals }: { totals: Totals }) {
    return (
        <SimpleGrid cols={{ base: 3 }} spacing="sm">
            <StatCard icon={<Route size={16} />} label="Trips" value={compact(totals.trips)} sub={intComma(totals.trips)} />
            <StatCard icon={<DollarSign size={16} />} label="Revenue" value={money(totals.revenue)} sub={moneyExact(totals.revenue)} />
            <StatCard icon={<Wallet size={16} />} label="Avg fare" value={`$${totals.avgFare.toFixed(2)}`} />
        </SimpleGrid>
    );
}
