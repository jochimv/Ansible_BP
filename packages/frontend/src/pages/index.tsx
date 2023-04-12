import React, { SyntheticEvent } from 'react';
import {
  Autocomplete,
  TextField,
  AutocompleteRenderInputParams,
  Stack,
  AutocompleteValue,
} from '@mui/material';
import { getProjectsHosts } from '@frontend/utils';
import { useRouter } from 'next/router';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { selectProject } from '@frontend/codeChanges/codeChangesReducer';
import { ProjectHosts } from '@frontend/utils/types';

interface HomePageProps {
  projectHosts: ProjectHosts[];
}
const HomePage = ({ projectHosts }: HomePageProps) => {
  const projectNames = projectHosts.map((projectHost: ProjectHosts) => projectHost.project);
  const router = useRouter();
  const { selectedProjectName } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  return (
    <Stack spacing={3}>
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
    </Stack>
  );
};

export async function getServerSideProps() {
  const projectHosts = await getProjectsHosts();
  return {
    props: { projectHosts },
  };
}

export default HomePage;
