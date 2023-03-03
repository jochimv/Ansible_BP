import type { AppProps } from 'next/app';
import { QueryClientProvider, QueryClient } from 'react-query';
import { createEmotionCache, theme } from '@frontend/utils/styling';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Button, ThemeProvider, Toolbar } from '@mui/material';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';
import { NextComponentType, NextPageContext } from 'next';
import '../styles/globals.css';

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
        <Toolbar />
        <Box sx={{ mx: 5, mt: 4, mb: 4 }}>
          <Component {...pageProps} />
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>
);

export default App;
