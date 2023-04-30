/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import React, { SyntheticEvent, useState } from 'react';
import {
  Autocomplete,
  TextField,
  AutocompleteRenderInputParams,
  Stack,
  Divider,
  AutocompleteValue,
  Button,
  Box,
  InputAdornment,
} from '@mui/material';
import { useRouter } from 'next/router';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { deleteProject, selectProject } from '@frontend/reducers/codeChangesReducer';
import DownloadIcon from '@mui/icons-material/Download';
import ImportProjectModal from '@frontend/components/ImportProjectModal';
import { FolderOff, FolderOutlined } from '@mui/icons-material';
import axios, { AxiosResponse } from 'axios';
import { useMutation, useQuery } from 'react-query';
import { useSnackbar } from '@frontend/context/SnackbarContext';
import ConfirmDialog from '@frontend/components/ConfirmDialog';
import { ProjectHosts, RepositoryActionResult } from '@frontend/types';
import { BE_IP_ADDRESS } from '@frontend/constants';
import LoadingPage from '@frontend/components/Loading';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const fetchProjectsHosts = async (): Promise<ProjectHosts[]> => {
  const response = await axios.get(`http://${BE_IP_ADDRESS}:4000/projects-hosts`);
  return response.data;
};
const deleteRepository = async (data: any): Promise<RepositoryActionResult> => {
  const response: AxiosResponse<any> = await axios.post(
    `http://${BE_IP_ADDRESS}:4000/delete-repository`,
    data,
  );
  return response.data;
};
const HomePage = () => {
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const {
    data: projectHosts,
    isLoading,
    refetch,
  } = useQuery('projectsHosts', fetchProjectsHosts, {
    onSuccess: (projectHosts) => {
      setProjectNames(projectHosts.map((projectHost: ProjectHosts) => projectHost.project));
    },
  });

  const router = useRouter();
  const { selectedProjectName = '' } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const [isImportProjectModalOpen, setIsImportProjectModalOpen] = useState(false);
  const { showMessage } = useSnackbar();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const handleDelete = () => {
    if (selectedProjectName) {
      mutate({ projectName: selectedProjectName });
    }
    setIsConfirmDialogOpen(false);
  };
  const handleChangeProjectsAutocompleteValues = () => {
    refetch();
    setProjectNames((projectNames: string[]) =>
      projectNames.filter((projectName: string) => projectName !== selectedProjectName),
    );
  };
  const { mutate } = useMutation(deleteRepository, {
    onSuccess: (response: RepositoryActionResult) => {
      const { success, error } = response;
      if (success) {
        showMessage(`${selectedProjectName} deleted successfully`, 'success');
        handleChangeProjectsAutocompleteValues();
        dispatch(deleteProject(selectedProjectName));
      } else {
        if (typeof error === 'string') {
          showMessage(error, 'error');
        } else {
          showMessage('An unknown error occurred', 'error');
        }
      }
    },
  });
  if (isLoading) {
    return <LoadingPage />;
  }
  return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
      <Stack spacing={3} width="min-content" sx={{ width: 'min-content' }}>
        <Autocomplete
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              label="Search project"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <FolderOutlined />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          options={projectNames}
          sx={{ width: 300 }}
          id="projects"
          onChange={(event: SyntheticEvent, newValue: string | null) => {
            dispatch(selectProject(newValue));
          }}
          value={selectedProjectName}
        />
        <Autocomplete
          id="servers"
          disabled={!selectedProjectName}
          options={
            projectHosts?.find(
              (projectHost: ProjectHosts) => projectHost.project === selectedProjectName,
            )?.hosts || []
          }
          sx={{ width: 300 }}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              label="Search server"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <FontAwesomeIcon icon={faServer} style={{ width: 18, height: 18 }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          onChange={(
            event: SyntheticEvent,
            newValue: AutocompleteValue<unknown, false, false, false>,
          ) => {
            router.push(`/${selectedProjectName}/host-details/${newValue}`);
          }}
        />
        <Divider style={{ width: '100%' }}>OR</Divider>
        <Button
          color="success"
          startIcon={<DownloadIcon />}
          onClick={() => setIsImportProjectModalOpen(true)}
        >
          Import repository
        </Button>
        <Button
          color="error"
          startIcon={<FolderOff />}
          onClick={() => {
            if (selectedProjectName) {
              setIsConfirmDialogOpen(true);
            }
          }}
          disabled={!selectedProjectName}
        >
          Delete selected repository
        </Button>
        <ImportProjectModal
          isOpen={isImportProjectModalOpen}
          onClose={() => setIsImportProjectModalOpen(false)}
          onSuccess={handleChangeProjectsAutocompleteValues}
        />
        <ConfirmDialog
          open={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Repository"
          message={`Are you sure you want to delete the project "${selectedProjectName}"?`}
        />
      </Stack>
    </Box>
  );
};

export default HomePage;
export { getProjectDetails } from '@frontend/pages/[projectName]/server-structure';
