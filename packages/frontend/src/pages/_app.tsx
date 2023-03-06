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
import AppProvider from './AppProvider';
import { useEditModeContext, useEditModeSetterContext } from '@frontend/pages/context';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, any>;
  pageProps?: any;
  emotionCache?: EmotionCache;
}

const AppBarResolver = () => {
  const isInEditMode = useEditModeContext();
  const setIsInEditMode = useEditModeSetterContext();
  return (
    <>
      <AppBar>
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Button
            startIcon={isInEditMode ? <EditIcon /> : <LibraryBooksIcon />}
            color="inherit"
            onClick={() => setIsInEditMode(!isInEditMode)}
          >
            {isInEditMode ? 'Edit mode' : 'Read mode'}
          </Button>
          <Button color="inherit" startIcon={<Search />} component={Link} href="/">
            Hledat
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
};

const App = ({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) => (
  <CacheProvider value={emotionCache}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AppProvider>
          <Head>
            <meta name="viewport" content="initial-scale=1, width=device-width" />
            <title>Ansible manager</title>
          </Head>
          <AppBarResolver />
          <Box sx={{ mx: 5, mt: 4, mb: 4 }}>
            <Component {...pageProps} />
          </Box>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>
);

export default App;
