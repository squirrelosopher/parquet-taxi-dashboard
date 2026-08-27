import { Box } from '@mantine/core';
import { Box as BoxIcon } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { GroupingSets } from './GroupingSets';
import type { Section } from '../lib/cube';

export function CubeSection({ sections, footerBytes }: { sections: Section[]; footerBytes: number }) {
    return (
        <Box>
            <SectionHeading icon={<BoxIcon size={14} />} label="Cube layout — hover to show" />
            <GroupingSets sections={sections} footerBytes={footerBytes} />
        </Box>
    );
}
