/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import SearchOffIcon from '@mui/icons-material/SearchOff';
import { NOT_FOUND_ICON_SX } from '@frontend/constants';
import { Stack, Typography } from '@mui/material';

const NoServersFound = () => (
  <Stack direction="column" height="100%" alignItems="center" justifyContent="center">
    <SearchOffIcon sx={NOT_FOUND_ICON_SX} />
    <Typography variant="h3">No servers found</Typography>
  </Stack>
);

export default NoServersFound;
