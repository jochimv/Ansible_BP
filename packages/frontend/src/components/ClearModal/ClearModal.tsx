import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableCell,
  TableContainer,
  Grid,
  TableHead,
  TableRow,
  Typography,
  TableBody,
  Tooltip,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
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
import { faBomb, faBroom } from '@fortawesome/free-solid-svg-icons';
import { getUpdatedFilesPaths } from '@frontend/pages/_app';
import { CodeOff as CodeOffIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography fontWeight="bold">Project name</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold"># of files changed</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">Action</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updatedProjects.map((updatedProject) => {
                    const { projectName } = updatedProject;
                    const updatedFilesPaths = getUpdatedFilesPaths(updatedProjects, projectName);
                    return (
                      <TableRow>
                        <TableCell>{projectName}</TableCell>
                        <TableCell>
                          <Stack spacing={2} direction="row">
                            <Typography>{updatedFilesPaths.length}</Typography>
                            <Tooltip title={updatedFilesPaths.map((path) => `${path},\n `)}>
                              <HelpOutline sx={{ color: 'info.main' }} />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Button
                            startIcon={
                              <FontAwesomeIcon style={{ width: 18, height: 18 }} icon={faBroom} />
                            }
                            onClick={() => handleRollbackProject(updatedProject.projectName)}
                          >
                            Clear
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
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
