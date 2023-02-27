import { Paper, Stack, Typography } from '@mui/material';

interface HostPageProps {
  host: string;
  project: string;
}

const HostPage = ({ host, project }: HostPageProps) => {
  return (
    <Stack>
      <Typography variant="h3">{host}</Typography>
      <Typography variant="h5">{project}</Typography>
      <Typography>Variables</Typography>
      <Paper elevation={3}>lorem ipsum dolor sit amet</Paper>
    </Stack>
  );
};

export default HostPage;

export async function getServerSideProps(context: any) {
  const { host, project } = context.query;
  return { props: { host, project } };
}
