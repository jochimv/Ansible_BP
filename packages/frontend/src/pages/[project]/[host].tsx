import { Paper, Stack, Typography } from '@mui/material';
import { getHostDetails } from '@frontend/utils';

interface HostPageProps {
  host: string;
  project: string;
  hostDetails: hostDetails[];
}

interface hostDetails {
  inventoryType: string;
  groupName: string;
  commonVars?: any;
  groupVars?: any;
  hostDetails: any;
}

const HostDetailsPage = ({ host, project, hostDetails }: HostPageProps) => {
  console.log(hostDetails);
  return (
    <Stack>
      <Typography variant="h3">{host}</Typography>
      <Typography variant="h5">{project}</Typography>
      <Typography>Variables</Typography>
      <Paper elevation={3}>lorem ipsum dolor sit amet</Paper>
    </Stack>
  );
};

export default HostDetailsPage;

export async function getServerSideProps(context: any) {
  const { host, project } = context.query;
  const hostDetails = getHostDetails(project, host);
  return { props: { host, project, hostDetails } };
}
