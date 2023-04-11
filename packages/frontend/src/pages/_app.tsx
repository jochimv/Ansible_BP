import type { NextComponentType, NextPageContext } from 'next';
import { QueryClientProvider, QueryClient } from 'react-query';
import { createEmotionCache, theme } from '@frontend/utils/styling';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Badge, Button, ThemeProvider, Toolbar } from '@mui/material';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { switchMode } from '@frontend/codeChanges/codeChangesReducer';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CodeChangesProvider from '../codeChanges/CodeChangesProvider';
import { AppProps } from 'next/app';
import '@frontend/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faGitAlt } from '@fortawesome/free-brands-svg-icons';
import ClearModalProvider from '@frontend/components/ClearModal/state/ClearModalProvider';
import { useClearModalDispatchContext } from '@frontend/components/ClearModal/state/ClearModalContext';
import { open } from '@frontend/components/ClearModal/state/clearModalReducer';
import ClearModal from '@frontend/components/ClearModal';
const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, Record<string, unknown>>;
  pageProps: Record<string, unknown>;
  emotionCache?: EmotionCache;
}

export function getUpdatedFilesPaths(projects, projectName) {
  const countedPaths = [];

  projects?.forEach(({ projectName: proj, hosts }) => {
    if (proj === projectName) {
      hosts.forEach(({ hostDetailsByInventoryType }) => {
        hostDetailsByInventoryType.forEach(({ variables }) => {
          variables.forEach(({ type, pathInProject, updated }) => {
            if (type !== 'applied' && updated) {
              if (!countedPaths.includes(pathInProject)) {
                countedPaths.push(pathInProject);
              }
            }
          });
        });
      });
    }
  });
  return countedPaths;
}

const AppBarResolver = () => {
  const { isInEditMode, selectedProjectName, updatedProjects } = useCodeChangesContext();
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const router = useRouter();
  const clearModalDispatch = useClearModalDispatchContext();

  const updatedFilesPaths = getUpdatedFilesPaths(updatedProjects, selectedProjectName);
  return (
    <>
      <AppBar>
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <ClearModal />
          <Button
            color="inherit"
            onClick={() => {
              clearModalDispatch(open());
            }}
            startIcon={<FontAwesomeIcon style={{ width: 18, height: 18 }} icon={faBroom} />}
          >
            Clear
          </Button>

          <Button
            color="inherit"
            startIcon={
              <Badge badgeContent={updatedFilesPaths.length} color="warning">
                <FontAwesomeIcon icon={faGitAlt} />
              </Badge>
            }
            component={Link}
            href={`/${selectedProjectName}/git`}
          >
            Git
          </Button>
          <Button
            startIcon={isInEditMode ? <EditIcon /> : <LibraryBooksIcon />}
            color="inherit"
            onClick={() => codeChangesDispatch(switchMode())}
          >
            {isInEditMode ? 'Edit mode' : 'Read mode'}
          </Button>
          <Button
            color="inherit"
            onClick={() => router.push(`/${selectedProjectName}`)}
            startIcon={<FolderOutlinedIcon />}
          >
            {selectedProjectName ? selectedProjectName : 'No project selected'}
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

const AutoSaveContextProvider = ({ children }) => {
  const codeChangesContextData = useCodeChangesContext();
  useEffect(() => {
    window.addEventListener('beforeunload', () => handleBeforeUnload(codeChangesContextData));

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener('beforeunload', () => handleBeforeUnload(codeChangesContextData));
    };
  }, [codeChangesContextData]);
  return <>{children}</>;
};

const handleBeforeUnload = (codeChangesContextData) => {
  localStorage.setItem('codeChangesContextData', JSON.stringify(codeChangesContextData));
};

const App = ({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) => {
  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CodeChangesProvider>
            <AutoSaveContextProvider>
              <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <title>Ansible manager</title>
              </Head>
              <ClearModalProvider>
                <AppBarResolver />
              </ClearModalProvider>
              <Box sx={{ mx: 5, mt: 4, mb: 4 }}>
                <Component {...pageProps} />
              </Box>
            </AutoSaveContextProvider>
          </CodeChangesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
};

export default App;
