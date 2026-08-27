import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@fontsource/nebula-sans/400.css';
import '@fontsource/nebula-sans/600.css';
import '@fontsource/nebula-sans/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './index.css';
import { theme } from './theme';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme} forceColorScheme="light">
            <App />
        </MantineProvider>
    </React.StrictMode>,
);
