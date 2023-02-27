import type { AppProps } from 'next/app';
import { QueryClientProvider, QueryClient } from 'react-query';
import createEmotionCache from '../utils/createEmotionCache';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Button, ThemeProvider, Toolbar } from '@mui/material';
import theme from '@frontend/utils/theme';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';

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
        <ThemeProvider theme={theme}>
          <Head>
            <meta name="viewport" content="initial-scale=1, width=device-width" />
          </Head>
          <AppBar>
            <Toolbar sx={{ justifyContent: 'flex-end' }}>
              <Button color="inherit" startIcon={<Search />} component={Link} href="/">
                Hledat
              </Button>
            </Toolbar>
          </AppBar>
          <Box sx={{ mt: 12, mx: 6 }}>
            <Component {...pageProps} />
          </Box>
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}
