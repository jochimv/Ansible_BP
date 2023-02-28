import React from 'react';
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
import { getProjectsHosts } from '@frontend/utils';
import { ProjectsHosts } from '@backend/types';
import { AutocompleteProjectHosts } from '@frontend/types';
const ListSubheader = styled(MuiListSubheader)({
  position: 'sticky',
  top: '-8px',
});

const transformForAutocomplete = (arr: ProjectsHosts = []): AutocompleteProjectHosts[] => {
  const autocompleteProjectHosts: AutocompleteProjectHosts[] = [];
  arr.forEach((obj) => {
    obj.hosts.forEach((host) => {
      autocompleteProjectHosts.push({ project: obj.project, host });
    });
  });
  return autocompleteProjectHosts;
};

interface HomeProps {
  autocompleteProjectsHosts: AutocompleteProjectHosts[];
}
const HomePage = ({ autocompleteProjectsHosts }: HomeProps) => {
  return (
    <Autocomplete
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField {...params} label="Vyhledat server" />
      )}
      options={autocompleteProjectsHosts}
      groupBy={(option) => option.project}
      getOptionLabel={(option) => option.host}
      sx={{ width: 300 }}
      renderGroup={(params: AutocompleteRenderGroupParams) => {
        // @ts-ignore
        const group = params?.children?.map((param) => (
          <ListItemButton key={param.key} component={Link} href={`/${params.group}/${param.key}`}>
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
};

export async function getServerSideProps() {
  const autocompleteProjectsHosts = transformForAutocomplete(getProjectsHosts());

  return {
    props: { autocompleteProjectsHosts },
  };
}

export default HomePage;
