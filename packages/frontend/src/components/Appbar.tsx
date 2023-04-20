import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { useRouter } from 'next/router';
import { useClearModalDispatchContext } from '@frontend/context/ClearModalContext';
import { getUpdatedFilesPaths } from '@frontend/utils';
import { AppBar, Badge, Button, Toolbar, Typography } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ClearModal from '@frontend/components/ClearModal';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Link from 'next/link';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { open } from '@frontend/reducers/clearModalReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faServer } from '@fortawesome/free-solid-svg-icons';
import { faGitAlt } from '@fortawesome/free-brands-svg-icons';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { switchMode } from '@frontend/reducers/codeChangesReducer';
import { Search } from '@mui/icons-material';
import React from 'react';

export const Appbar = () => {
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
            {selectedProjectName ?? 'No project selected'}
          </Typography>
          <ClearModal />
          {/*<Button color="inherit" onClick={() => codeChangesDispatch({ type: 'clear' })}>
            Clear context
          </Button>*/}
          <Button
            id="button-clear"
            color="inherit"
            onClick={() => {
              clearModalDispatch(open());
            }}
            startIcon={<FontAwesomeIcon style={{ width: 18, height: 18 }} icon={faBroom} />}
          >
            Clear
          </Button>
          <Button
            id="button-mode"
            startIcon={isInEditMode ? <EditIcon /> : <LibraryBooksIcon />}
            color="inherit"
            onClick={() => codeChangesDispatch(switchMode())}
          >
            {isInEditMode ? 'Edit mode' : 'Read mode'}
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
            href={`/${selectedProjectName}/git`}
          >
            Git
          </Button>
          <Button
            id="button-dashboard"
            color="inherit"
            startIcon={<DashboardIcon />}
            component={Link}
            href={`/${selectedProjectName}/dashboard`}
          >
            Dashboard
          </Button>
          <Button
            id="button-runner"
            color="inherit"
            startIcon={<PlayCircleOutlineIcon />}
            component={Link}
            href={`/${selectedProjectName}/runner`}
          >
            Runner
          </Button>
          <Button
            id="button-overview"
            color="inherit"
            onClick={() => router.push(`/${selectedProjectName}/overview`)}
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
