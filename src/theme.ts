import { createTheme } from '@mantine/core';

const FONT = '"Nebula Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

// Taxi-yellow accent, but used sparingly. Nebula Sans throughout.
export const theme = createTheme({
    primaryColor: 'yellow',
    primaryShade: { light: 7, dark: 5 },
    fontFamily: FONT,
    fontFamilyMonospace: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
    headings: { fontFamily: FONT, fontWeight: '650' },
    defaultRadius: 'md',
    cursorType: 'pointer',
    autoContrast: true,
});
