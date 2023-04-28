/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import type { NextComponentType, NextPageContext } from 'next';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createEmotionCache, theme } from '@frontend/styles';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Box, ThemeProvider } from '@mui/material';
import { AppProps } from 'next/app';
import '@frontend/css/globals.css';
import React from 'react';
import { SnackbarProvider } from '@frontend/context/SnackbarContext';
import { CommandsProvider } from '@frontend/context/CommandContext';
import { Appbar } from '@frontend/components/Appbar';
import { AutoSaveContextProvider } from '@frontend/context/AutosaveContext';
import CodeChangesProvider from '@frontend/context/CodeChangesContext';
import ClearModalProvider from '@frontend/context/RollbackModalContext';

const queryClient = new QueryClient();
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, Record<string, unknown>>;
  pageProps: Record<string, unknown>;
  emotionCache?: EmotionCache;
}

const App = ({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) => (
  <CacheProvider value={emotionCache}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CodeChangesProvider>
          <CommandsProvider>
            <AutoSaveContextProvider>
              <SnackbarProvider>
                <Head>
                  <meta name="viewport" content="initial-scale=1, width=device-width" />
                  <title>Ansible manager</title>
                </Head>
                <ClearModalProvider>
                  <Appbar />
                </ClearModalProvider>
                <Box mx={5} my={4}>
                  <Component {...pageProps} />
                </Box>
              </SnackbarProvider>
            </AutoSaveContextProvider>
          </CommandsProvider>
        </CodeChangesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>
);

export default App;
