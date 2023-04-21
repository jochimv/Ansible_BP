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
} from '@mui/material';
import { useRouter } from 'next/router';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { deleteProject, selectProject } from '@frontend/codeChanges/codeChangesReducer';
import { ProjectHosts } from '@frontend/utils/types';
import DownloadIcon from '@mui/icons-material/Download';
import ImportProjectModal from '@frontend/components/ImportProjectModal';
import { FolderOff } from '@mui/icons-material';
import axios, { AxiosResponse } from 'axios';
import { useMutation, useQuery } from 'react-query';
import { useSnackbar } from '@frontend/components/ImportProjectModal/state/SnackbarContext';
import ConfirmDialog from '@frontend/components/ConfirmDialog';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';

const fetchProjectsHosts = async () => {
  const response = await axios.get(`http://${BE_IP_ADDRESS}:4000/projects`);
  return response.data;
};
const deleteRepository = (data: any) =>
  axios.post(`http://${BE_IP_ADDRESS}:4000/deleteRepository`, data);
const HomePage = () => {
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const { data: projectHosts } = useQuery('projectsHosts', fetchProjectsHosts, {
    onSuccess: (projectHosts) => {
      setProjectNames(projectHosts.map((projectHost: ProjectHosts) => projectHost.project));
    },
  });

  const router = useRouter();
  const { selectedProjectName } = useCodeChangesContext();
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
  const handleChangeProjectsAutocompleteValues = () =>
    setProjectNames((projectNames: string[]) =>
      projectNames.filter((projectName: string) => projectName !== selectedProjectName),
    );

  const { mutate } = useMutation(deleteRepository, {
    onSuccess: (response: AxiosResponse<any>) => {
      if (response.data.success) {
        showMessage(`${selectedProjectName} deleted successfully`, 'success');
        handleChangeProjectsAutocompleteValues();
        dispatch(deleteProject(selectedProjectName));
      } else {
        showMessage(response.data.error, 'error');
      }
    },
  });
  return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
      <Stack spacing={3} sx={{ width: 'min-content' }}>
        <Autocomplete
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField {...params} label="Search project" />
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
            <TextField {...params} label="Search server" />
          )}
          onChange={(
            event: SyntheticEvent,
            newValue: AutocompleteValue<unknown, false, false, false>,
          ) => {
            router.push(`/${selectedProjectName}/host/${newValue}`);
          }}
        />
        <Divider style={{ width: '100%' }}>OR</Divider>
        <Button startIcon={<DownloadIcon />} onClick={() => setIsImportProjectModalOpen(true)}>
          Import repository
        </Button>
        <Button
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
