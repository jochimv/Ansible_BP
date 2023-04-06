import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  useClearModalContext,
  useClearModalDispatchContext,
} from '@frontend/components/ClearModal/state/ClearModalContext';
import { CloseButton } from '@frontend/components/CloseButton';
import { close } from '@frontend/components/ClearModal/state/clearModalReducer';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import {
  clearProjectUpdates,
  clearProjectUpdatesFromEditor,
  clearProjectUpdatesIncludingGit,
  initializeContext,
  initialState,
} from '@frontend/codeChanges/codeChangesReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faBroom } from '@fortawesome/free-solid-svg-icons';
import { countUpdatedVariables } from '@frontend/pages/_app';
import { CodeOff as CodeOffIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';

function hasUpdatedVariables(projects) {
  for (const project of projects) {
    for (const host of project.hosts) {
      for (const inventoryType of host.hostDetailsByInventoryType) {
        for (const variable of inventoryType.variables) {
          if (variable.updated && variable.type !== 'applied') {
            return true;
          }
        }
      }
    }
  }
  return false;
}

const ClearModal = () => {
  const { isModalOpen } = useClearModalContext();
  const dispatch = useClearModalDispatchContext();
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { updatedProjects } = useCodeChangesContext();
  const closeModal = () => dispatch(close());
  const router = useRouter();

  const handleRollbackProject = (projectName: string) => {
    switch (router.pathname) {
      case '/[projectName]/git': {
        codeChangesDispatch(clearProjectUpdatesIncludingGit(projectName));
        break;
      }
      case '/[projectName]/[hostname]': {
        const { projectName, hostname } = router.query;
        codeChangesDispatch(clearProjectUpdatesFromEditor({ projectName, hostname }));
        break;
      }
      default: {
        codeChangesDispatch(clearProjectUpdates(projectName));
      }
    }
  };

  const hasUpdatedVariable = hasUpdatedVariables(updatedProjects);
  // todo - clear the changes from the rest of the state. If you try do do it while having updated variables open, it does not work correctly
  return (
    <Dialog open={isModalOpen} sx={{ width: 1000 }}>
      <DialogTitle>Clear changes</DialogTitle>
      {hasUpdatedVariable ? (
        <>
          <DialogContent>
            {updatedProjects.map((updatedProject) => {
              const { projectName } = updatedProject;
              const updatedFilesCount = countUpdatedVariables(updatedProjects, projectName);
              return (
                <Grid
                  container
                  spacing={3}
                  alignItems="center"
                  justifyContent="space-between"
                  key={projectName}
                >
                  <Grid item xs={6}>
                    <Typography>{projectName}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography>{updatedFilesCount}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      startIcon={
                        <FontAwesomeIcon style={{ width: 18, height: 18 }} icon={faBroom} />
                      }
                      onClick={() => handleRollbackProject(updatedProject.projectName)}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              );
            })}
          </DialogContent>
          <DialogActions>
            <Button
              color="success"
              startIcon={<FontAwesomeIcon icon={faBomb} />}
              onClick={() => {
                codeChangesDispatch(initializeContext(initialState));
                localStorage.removeItem('codeChangesContextData');
                dispatch(close());
              }}
            >
              Clear all
            </Button>
            <CloseButton onClick={closeModal}>Close</CloseButton>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            <Stack alignItems="center">
              <CodeOffIcon sx={{ width: 30, height: 30 }} />
              <Typography variant="h5">No changes</Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <CloseButton onClick={closeModal}>Close</CloseButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ClearModal;
