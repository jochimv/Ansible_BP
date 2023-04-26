import SearchOffIcon from '@mui/icons-material/SearchOff';
import { notFoundIconSx } from '@frontend/constants';
import { Stack, Typography } from '@mui/material';

const NoServersFound = () => (
  <Stack direction="column" height="100%" alignItems="center" justifyContent="center">
    <SearchOffIcon sx={notFoundIconSx} />
    <Typography variant="h3">No servers found</Typography>
  </Stack>
);

export default NoServersFound;
