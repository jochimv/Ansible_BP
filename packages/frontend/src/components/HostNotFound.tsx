import { SearchOff } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { notFoundIconSx } from '@frontend/constants';

const HostNotFound = () => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <SearchOff sx={notFoundIconSx} />
    <Typography variant="h4">Host not found</Typography>
  </Stack>
);

export default HostNotFound;
