/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { FolderOffOutlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { NOT_FOUND_ICON_SX } from '@frontend/constants';

const ProjectNotFound = () => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <FolderOffOutlined sx={NOT_FOUND_ICON_SX} />
    <Typography variant="h4">Project not found</Typography>
  </Stack>
);

export default ProjectNotFound;
