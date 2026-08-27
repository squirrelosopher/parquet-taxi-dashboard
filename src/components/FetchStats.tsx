import { Group } from '@mantine/core';
import { MiniStat } from './ui';
import { fmtSections } from '../lib/format';
import type { ViewResult } from '../lib/cube';

export function FetchStats({ view }: { view: ViewResult | null }) {
    return (
        <Group gap={24} wrap="wrap">
            <MiniStat label="Sections" value={fmtSections(view?.sections ?? [])} w={128} />
            <MiniStat label="Fetched" value={`${((view?.bytes ?? 0) / 1024).toFixed(0)} KB`} />
            <MiniStat label="Row groups" value={String(view?.groupsRead ?? 0)} />
            <MiniStat label="Requests" value={String(view?.requests ?? 0)} />
            <MiniStat label="Time" value={`${Math.round(view?.ms ?? 0)} ms`} />
        </Group>
    );
}
