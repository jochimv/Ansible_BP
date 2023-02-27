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
import useAutocompleteProjectHosts from '@frontend/utils/hooks/useAutocompleteProjectsHosts';
const ListSubheader = styled(MuiListSubheader)({
  position: 'sticky',
  top: '-8px',
});

const Home = () => {
  const { data = [] } = useAutocompleteProjectHosts();

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

export default Home;
