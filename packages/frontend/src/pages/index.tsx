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
import { getProjectsHosts } from '@frontend/utils';
import { useRouter } from 'next/router';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { selectProject } from '@frontend/codeChanges/codeChangesReducer';
import { ProjectHosts } from '@frontend/utils/types';
import DownloadIcon from '@mui/icons-material/Download';
import ImportProjectModal from '@frontend/components/ImportProjectModal';

interface HomePageProps {
  projectHosts: ProjectHosts[];
}
const HomePage = ({ projectHosts }: HomePageProps) => {
  const projectNames = projectHosts.map((projectHost: ProjectHosts) => projectHost.project);
  const router = useRouter();
  const { selectedProjectName } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const [isImportProjectModalOpen, setIsImportProjectModalOpen] = useState(false);
  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <Stack spacing={3} sx={{ width: 'min-content' }}>
        <Autocomplete
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField {...params} label="Vyhledat projekt" />
          )}
          options={projectNames}
          sx={{ width: 300 }}
          id="projects"
          onChange={(event: SyntheticEvent, newValue: string | null) => {
            dispatch(selectProject(newValue));
          }}
          value={selectedProjectName ?? undefined}
        />
        <Autocomplete
          id="servers"
          disabled={!selectedProjectName}
          options={
            projectHosts.find(
              (projectHost: ProjectHosts) => projectHost.project === selectedProjectName,
            )?.hosts || []
          }
          sx={{ width: 300 }}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField {...params} label="Vyhledat server" />
          )}
          onChange={(
            event: SyntheticEvent,
            newValue: AutocompleteValue<unknown, false, false, false>,
          ) => {
            router.push(`/${selectedProjectName}/${newValue}`);
          }}
        />
        <Divider style={{ width: '100%' }}>OR</Divider>
        <Button startIcon={<DownloadIcon />} onClick={() => setIsImportProjectModalOpen(true)}>
          Import repository
        </Button>
        <ImportProjectModal
          isOpen={isImportProjectModalOpen}
          onClose={() => setIsImportProjectModalOpen(false)}
        />
      </Stack>
    </Box>
  );
};

export async function getServerSideProps() {
  const projectHosts = await getProjectsHosts();
  return {
    props: { projectHosts },
  };
}

export default HomePage;
