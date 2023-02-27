import React from 'react';
import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import {
  Autocomplete,
  TextField,
  ListItemButton,
  ListSubheader as MuiListSubheader,
  ListItemText,
  styled,
  AutocompleteRenderGroupParams,
  AutocompleteRenderInputParams,
} from '@mui/material';
import Link from 'next/link';
import { AutocompleteProjectsHosts } from '@frontend/types';
import { ProjectsHosts } from '@backend/types';

const ListSubheader = styled(MuiListSubheader)({
  position: 'sticky',
  top: '-8px',
});

const fetchInventoryFilesPaths = () => {
  return axios.get('http://localhost:4000/projects');
};

function transformForAutocomplete(arr: ProjectsHosts): AutocompleteProjectsHosts {
  const autocompleteProjectHosts: AutocompleteProjectsHosts = [];

  arr.forEach((obj) => {
    obj.hosts.forEach((host) => {
      autocompleteProjectHosts.push({ project: obj.project, host });
    });
  });
  return autocompleteProjectHosts;
}
export default function Home() {
  const {
    isError,
    error,
    data = [],
  }: UseQueryResult<readonly any[], string> = useQuery(
    'inventory-files',
    fetchInventoryFilesPaths,
    { select: (data) => transformForAutocomplete(data.data) },
  );

  if (isError) {
    return <div>{error}</div>;
  }

  return (
    <Autocomplete
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField {...params} label="Vyhledat server" />
      )}
      options={data}
      groupBy={(option) => option.project}
      getOptionLabel={(option) => option.host}
      sx={{ width: 300 }}
      renderGroup={(params: AutocompleteRenderGroupParams) => {
        // @ts-ignore
        const group = params?.children?.map((param) => (
          <ListItemButton key={param.key} component={Link} href={`/hosts/${param.key}`}>
            <ListItemText primary={param.key} />
          </ListItemButton>
        ));

        return (
          <React.Fragment key={params.key}>
            <ListSubheader>{params.group}</ListSubheader>
            {group}
          </React.Fragment>
        );
      }}
    />
  );
}
