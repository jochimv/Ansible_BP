import type { NextComponentType, NextPageContext } from 'next';
import { QueryClientProvider, QueryClient } from 'react-query';
import { createEmotionCache, theme } from '@frontend/utils/styling';
import { CacheProvider, EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { Badge, Button, ThemeProvider, Toolbar, Typography } from '@mui/material';
import { AppBar, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import Link from 'next/link';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { CodeChangesState, switchMode } from '@frontend/codeChanges/codeChangesReducer';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CodeChangesProvider from '../codeChanges/CodeChangesProvider';
import { AppProps } from 'next/app';
import '@frontend/styles/globals.css';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faServer } from '@fortawesome/free-solid-svg-icons';
import { faGitAlt } from '@fortawesome/free-brands-svg-icons';
import ClearModalProvider from '@frontend/components/ClearModal/state/ClearModalProvider';
import { useClearModalDispatchContext } from '@frontend/components/ClearModal/state/ClearModalContext';
import { open } from '@frontend/components/ClearModal/state/clearModalReducer';
import ClearModal from '@frontend/components/ClearModal';
import { Host, HostDetails, HostVariable, Project } from '@frontend/utils/types';
import { SnackbarProvider } from '@frontend/components/ImportProjectModal/state/SnackbarContext';
import { Command, CommandsProvider, useCommandContext } from '@frontend/contexts/commandContext';
const queryClient = new QueryClient();

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  Component: NextComponentType<NextPageContext, any, Record<string, unknown>>;
  pageProps: Record<string, unknown>;
  emotionCache?: EmotionCache;
}

export function getUpdatedFilesPaths(projects: Project[], projectName: string | null) {
  const updatedFilesPaths: string[] = [];

  projects?.forEach(({ projectName: proj, hosts }: { projectName: string; hosts: Host[] }) => {
    if (proj === projectName) {
      hosts.forEach(
        ({ hostDetailsByInventoryType }: { hostDetailsByInventoryType: HostDetails[] }) => {
          hostDetailsByInventoryType.forEach(({ variables }: { variables: HostVariable[] }) => {
            variables.forEach(({ type, pathInProject, updated }) => {
              if (type !== 'applied' && updated) {
                if (!updatedFilesPaths.includes(pathInProject)) {
                  updatedFilesPaths.push(pathInProject);
                }
              }
            });
          });
        },
      );
    }
  });
  return updatedFilesPaths;
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
          <FolderOutlinedIcon sx={{ width: 20, height: 20 }} />
          <Typography
            sx={{
              flexGrow: 1,
              ml: 1,
              textTransform: 'uppercase',
              fontSize: '15px',
              cursor: 'default',
            }}
          >
            {selectedProjectName}
          </Typography>
          <ClearModal />
          <Button
            color="inherit"
            startIcon={<PlayCircleOutlineIcon />}
            component={Link}
            href={`/${selectedProjectName}/runner`}
          >
            Runner
          </Button>
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
            onClick={() => router.push(`/${selectedProjectName}/overview`)}
            startIcon={<FontAwesomeIcon icon={faServer} style={{ width: 18, height: 18 }} />}
          >
            Overview
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

interface AutoSaveContextProviderProps {
  children: ReactNode;
}
const AutoSaveContextProvider = ({ children }: AutoSaveContextProviderProps) => {
  const codeChangesContextData = useCodeChangesContext();
  const { commands } = useCommandContext();
  useEffect(() => {
    window.addEventListener('beforeunload', () =>
      handleBeforeUnload(codeChangesContextData, commands),
    );

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener('beforeunload', () =>
        handleBeforeUnload(codeChangesContextData, commands),
      );
    };
  }, [codeChangesContextData, commands]);
  return <>{children}</>;
};

const handleBeforeUnload = (
  codeChangesContextData: CodeChangesState,
  commandContextData: Command[],
) => {
  localStorage.setItem('commandsContext', JSON.stringify(commandContextData));
  localStorage.setItem('codeChangesContextData', JSON.stringify(codeChangesContextData));
};

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
                  <AppBarResolver />
                </ClearModalProvider>
                <Box sx={{ mx: 5, mt: 4, mb: 4 }}>
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
