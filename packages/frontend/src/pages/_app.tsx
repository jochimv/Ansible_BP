import type { NextComponentType, NextPageContext } from 'next';
import { QueryClientProvider, QueryClient } from 'react-query';
import { createEmotionCache, theme } from '@frontend/utils/styling';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Button, ThemeProvider, Toolbar } from '@mui/material';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '@frontend/context/context';
import { switchMode } from '@frontend/context/reducer';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GitHubIcon from '@mui/icons-material/GitHub';
import CodeChangesProvider from '../context/CodeChangesProvider';
import { AppProps } from 'next/app';
import '@frontend/styles/globals.css';

const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, Record<string, unknown>>;
  pageProps: Record<string, unknown>;
  emotionCache?: EmotionCache;
}

const AppBarResolver = () => {
  const context = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const isInEditMode = context.isInEditMode;

  return (
    <>
      <AppBar>
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Button color="inherit" startIcon={<GitHubIcon />} component={Link} href="/git">
            Git
          </Button>
          <Button
            startIcon={isInEditMode ? <EditIcon /> : <LibraryBooksIcon />}
            color="inherit"
            onClick={() => dispatch(switchMode())}
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
        <CodeChangesProvider>
          <Head>
            <meta name="viewport" content="initial-scale=1, width=device-width" />
            <title>Ansible manager</title>
          </Head>
          <AppBarResolver />
          <Box sx={{ mx: 5, mt: 4, mb: 4 }}>
            <Component {...pageProps} />
          </Box>
        </CodeChangesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>
);

export default App;
