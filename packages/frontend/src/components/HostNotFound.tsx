/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { SearchOff } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { NOT_FOUND_ICON_SX } from '@frontend/constants';

const HostNotFound = () => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <SearchOff sx={NOT_FOUND_ICON_SX} />
    <Typography variant="h4">Host not found</Typography>
  </Stack>
);

export default HostNotFound;
