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
  clearAllProjectsUpdates,
  clearAllProjectUpdatesFromEditor,
  clearProjectUpdates,
  clearProjectUpdatesFromEditor,
} from '@frontend/codeChanges/codeChangesReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faBroom } from '@fortawesome/free-solid-svg-icons';
import { countUpdatedVariables } from '@frontend/pages/_app';
import { CodeOff as CodeOffIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';

// todo - project has updated variables možná, a to by se dalo použít i k mazání updatedProjects na BE
function findIfAnyVariableWasUpdated(projects) {
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

  const handleRollbackAllProjects = () => {
    switch (router.pathname) {
      case '/[projectName]/[hostname]': {
        codeChangesDispatch(clearAllProjectUpdatesFromEditor(router.query));
        break;
      }
      default: {
        codeChangesDispatch(clearAllProjectsUpdates());
      }
    }
  };

  const handleRollbackProject = (projectName: string) => {
    switch (router.pathname) {
      case '/[projectName]/[hostname]': {
        codeChangesDispatch(clearProjectUpdatesFromEditor(router.query));
        break;
      }
      default: {
        codeChangesDispatch(clearProjectUpdates(projectName));
      }
    }
  };

  const hasUpdatedVariable = findIfAnyVariableWasUpdated(updatedProjects);

  return (
    <Dialog open={isModalOpen} fullWidth maxWidth="sm">
      <DialogTitle>Clear changes</DialogTitle>
      {hasUpdatedVariable ? (
        <>
          <DialogContent>
            <Grid container alignItems="center" justifyContent="center">
              <Grid item xs={5}>
                <Typography fontWeight="bold">Project name</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography fontWeight="bold"># of files changed</Typography>
              </Grid>
              <Grid item xs={2} />
            </Grid>
            {updatedProjects.map((updatedProject) => {
              const { projectName } = updatedProject;
              const updatedFilesCount = countUpdatedVariables(updatedProjects, projectName);
              return (
                <Grid
                  container
                  spacing={3}
                  alignItems="center"
                  justifyContent="center"
                  key={projectName}
                >
                  <Grid item xs={6}>
                    <Typography>{projectName}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography>{updatedFilesCount}</Typography>
                  </Grid>
                  <Grid item xs={2}>
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
                handleRollbackAllProjects();
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
