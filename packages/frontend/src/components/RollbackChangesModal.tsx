/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TableBody,
  Tooltip,
} from '@mui/material';
import { HelpOutline, Replay } from '@mui/icons-material';
import {
  useRollbackModalContext,
  useRollbackModalDispatchContext,
} from '@frontend/context/RollbackModalContext';
import { CloseButton } from '@frontend/components/CloseButton';
import { close } from '@frontend/reducers/clearModalReducer';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import {
  clearAllProjectsUpdates,
  clearAllProjectUpdatesFromEditor,
  clearProjectUpdates,
  clearProjectUpdatesFromEditor,
} from '@frontend/reducers/codeChangesReducer';
import { CodeOff as CodeOffIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { getUpdatedFilesPaths } from '@frontend/utils';
import { Project } from '@frontend/types';
import useUserIsInHostDetailsPage from '@frontend/hooks/useUserIsInHostDetailsPage';

const findIfAnyVariableWasUpdated = (projects: Project[]): boolean => {
  if (!projects) {
    return false;
  }
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
};

const RollbackChangesModal = () => {
  const { isModalOpen } = useRollbackModalContext();
  const dispatch = useRollbackModalDispatchContext();
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { updatedProjects } = useCodeChangesContext();
  const closeModal = () => dispatch(close());
  const router = useRouter();
  const isInHostDetailsPage = useUserIsInHostDetailsPage();

  const handleRollbackAllProjects = (): void => {
    if (isInHostDetailsPage) {
      codeChangesDispatch(clearAllProjectUpdatesFromEditor(router.query));
    } else {
      codeChangesDispatch(clearAllProjectsUpdates());
    }
  };

  const handleRollbackProject = (projectNameToRollback: string): void => {
    const currentProject = router.query.projectName;
    if (currentProject === projectNameToRollback && isInHostDetailsPage) {
      codeChangesDispatch(clearProjectUpdatesFromEditor(router.query));
    } else {
      codeChangesDispatch(clearProjectUpdates(projectNameToRollback));
    }
  };

  const hasUpdatedVariable = findIfAnyVariableWasUpdated(updatedProjects);

  return (
    <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>Changes overview</DialogTitle>
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
                  {updatedProjects.map((updatedProject: Project) => {
                    const { projectName } = updatedProject;
                    const updatedFilesPaths = getUpdatedFilesPaths(updatedProjects, projectName);
                    return (
                      <TableRow key={updatedProject.projectName}>
                        <TableCell>{projectName}</TableCell>
                        <TableCell>
                          <Stack spacing={2} direction="row">
                            <Typography>{updatedFilesPaths.length}</Typography>
                            <Tooltip title={updatedFilesPaths.map((path: string) => `${path},\n `)}>
                              <HelpOutline sx={{ color: 'info.main' }} />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Button
                            startIcon={<Replay />}
                            color="warning"
                            onClick={() => handleRollbackProject(updatedProject.projectName)}
                          >
                            Rollback
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
              startIcon={<Replay />}
              onClick={() => {
                handleRollbackAllProjects();
                localStorage.removeItem('codeChangesContextData');
                dispatch(close());
              }}
            >
              Rollback all
            </Button>
            <CloseButton onClick={closeModal}>Close</CloseButton>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            <Stack alignItems="center">
              <CodeOffIcon width={30} height={30} />
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

export default RollbackChangesModal;
