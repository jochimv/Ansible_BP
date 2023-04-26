import { FolderOffOutlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { notFoundIconSx } from '@frontend/constants';

const ProjectNotFound = () => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <FolderOffOutlined sx={notFoundIconSx} />
    <Typography variant="h4">Project not found</Typography>
  </Stack>
);

export default ProjectNotFound;
