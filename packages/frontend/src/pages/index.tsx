import React from 'react';
import { Autocomplete, TextField, AutocompleteRenderInputParams, Stack } from '@mui/material';
import { getProjectsHosts } from '@frontend/utils';
import { useRouter } from 'next/router';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '@frontend/context/context';
import { selectProject } from '@frontend/context/reducer';

const HomePage = ({ projectHosts }) => {
  const projectNames = projectHosts.map((projectHost) => projectHost.project);

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
        onChange={(event, newValue: string) => {
          dispatch(selectProject(newValue));
        }}
        value={selectedProjectName ?? null}
      />
      <Autocomplete
        id="servers"
        disabled={!selectedProjectName}
        options={
          projectHosts.find((projectHost) => projectHost.project === selectedProjectName)?.hosts ||
          []
        }
        sx={{ width: 300 }}
        renderInput={(params: AutocompleteRenderInputParams) => (
          <TextField {...params} label="Vyhledat server" />
        )}
        onChange={(event, newValue) => {
          router.push(`/${selectedProjectName}/${newValue}`);
        }}
      />
    </Stack>
  );
};

export async function getServerSideProps() {
  const projectHosts = getProjectsHosts();
  return {
    props: { projectHosts },
  };
}

export default HomePage;
