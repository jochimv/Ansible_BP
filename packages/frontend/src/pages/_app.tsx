import type { AppProps } from 'next/app';
import { QueryClientProvider, QueryClient } from 'react-query';
import createEmotionCache from '../utils/createEmotionCache';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material';
import theme from '@frontend/utils/theme';
import { AppBar } from '@mui/material';

const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}
export default function App({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: MyAppProps) {
  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <ThemeProvider theme={theme}>
          <AppBar>Appbar</AppBar>
          <Component {...pageProps} />
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}
