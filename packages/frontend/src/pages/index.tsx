import React, { useState } from 'react';
import { Autocomplete, TextField, AutocompleteRenderInputParams } from '@mui/material';
import { getProjectsHosts } from '@frontend/utils';
import { useRouter } from 'next/router';

const HomePage = ({ projectHosts }) => {
  const [selectedProjectName, setSelectedProjectName] = useState();
  const projectNames = projectHosts.map((projectHost) => projectHost.project);

  const router = useRouter();

  return (
    <>
      <Autocomplete
        renderInput={(params: AutocompleteRenderInputParams) => (
          <TextField {...params} label="Vyhledat projekt" />
        )}
        options={projectNames}
        sx={{ width: 300 }}
        id="projects"
        onChange={(event, newValue: string) => {
          setSelectedProjectName(newValue);
        }}
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
    </>
  );
};

export async function getServerSideProps() {
  const projectHosts = getProjectsHosts();

  return {
    props: { projectHosts },
  };
}

export default HomePage;
