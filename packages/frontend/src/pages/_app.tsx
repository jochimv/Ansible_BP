import type { AppProps } from 'next/app';
import { QueryClientProvider, QueryClient } from 'react-query';
import { createEmotionCache, theme } from '@frontend/utils/styling';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Button, ThemeProvider, Toolbar } from '@mui/material';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';
import { ReactQueryDevtools } from 'react-query/devtools';
import { NextComponentType, NextPageContext } from 'next';

const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, any>;
  pageProps?: any;
  emotionCache?: EmotionCache;
}
const App = ({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) => (
  <CacheProvider value={emotionCache}>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
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

export default App;
