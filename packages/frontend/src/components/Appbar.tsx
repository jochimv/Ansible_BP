import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { useRollbackModalDispatchContext } from '@frontend/context/RollbackModalContext';
import { getUpdatedFilesPaths } from '@frontend/utils';
import { AppBar, Badge, Button, Toolbar, Typography } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import RollbackChangesModal from '@frontend/components/RollbackChangesModal';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Link from 'next/link';
import { open } from '@frontend/reducers/clearModalReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { faGitAlt } from '@fortawesome/free-brands-svg-icons';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { switchMode } from '@frontend/reducers/codeChangesReducer';
import { Commit, Search } from '@mui/icons-material';
import React, { SyntheticEvent } from 'react';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from '@frontend/context/SnackbarContext';
import useUserIsInHostDetailsPage from '@frontend/hooks/useUserIsInHostDetailsPage';

export const Appbar = () => {
  const { isInEditMode, selectedProjectName, updatedProjects, selectedVariables } =
    useCodeChangesContext();
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const clearModalDispatch = useRollbackModalDispatchContext();
  const updatedFilesPaths = getUpdatedFilesPaths(updatedProjects, selectedProjectName);
  const { showMessage } = useSnackbar();

  //const router = useRouter();
  const isInHostDetailsPage = useUserIsInHostDetailsPage();

  const onNavigationClick = (event: SyntheticEvent) => {
    if (isNavigationDisabled) {
      event.preventDefault();
      showMessage('No project selected', 'error');
    }
  };
  const isNavigationDisabled = selectedProjectName === null || undefined;
  return (
    <>
      <AppBar>
        <Toolbar sx={{ justifyContent: 'flex-end', columnGap: 1 }}>
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
            {selectedProjectName ?? 'No project selected'}
          </Typography>
          <RollbackChangesModal />
          {/*<Button color="inherit" onClick={() => codeChangesDispatch({ type: 'clear' })}>
            Clear context
          </Button>*/}
          {isInHostDetailsPage && selectedVariables.type !== 'applied' && (
            <Button
              id="button-mode"
              startIcon={isInEditMode ? <EditIcon /> : <LibraryBooksIcon />}
              color="inherit"
              onClick={() => codeChangesDispatch(switchMode())}
            >
              {isInEditMode ? 'Edit mode' : 'Read mode'}
            </Button>
          )}
          <Button
            id="button-clear"
            color="inherit"
            onClick={() => {
              clearModalDispatch(open());
            }}
            startIcon={<Commit />}
          >
            Changes
          </Button>
          <Button
            id="button-git"
            color="inherit"
            startIcon={
              <Badge badgeContent={updatedFilesPaths.length} color="warning">
                <FontAwesomeIcon icon={faGitAlt} />
              </Badge>
            }
            component={Link}
            href={isNavigationDisabled ? '#' : `/${selectedProjectName}/git`}
            onClick={onNavigationClick}
          >
            Git
          </Button>
          <Button
            id="button-dashboard"
            color="inherit"
            startIcon={<DashboardIcon />}
            component={Link}
            href={isNavigationDisabled ? '#' : `/${selectedProjectName}/dashboard`}
            onClick={onNavigationClick}
          >
            Dashboard
          </Button>
          <Button
            id="button-commands"
            color="inherit"
            startIcon={<FontAwesomeIcon icon={faTerminal} style={{ width: 18, height: 18 }} />}
            component={Link}
            href={isNavigationDisabled ? '#' : `/${selectedProjectName}/commands`}
            onClick={onNavigationClick}
          >
            Commands
          </Button>
          <Button
            id="button-overview"
            color="inherit"
            component={Link}
            href={isNavigationDisabled ? '#' : `/${selectedProjectName}/overview`}
            onClick={onNavigationClick}
            startIcon={<FontAwesomeIcon icon={faServer} style={{ width: 18, height: 18 }} />}
          >
            Overview
          </Button>
          <Button
            id="button-search"
            color="inherit"
            startIcon={<Search />}
            component={Link}
            href="/"
          >
            Search
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
};
