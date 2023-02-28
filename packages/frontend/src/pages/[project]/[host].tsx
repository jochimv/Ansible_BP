import { Paper, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useQuery } from 'react-query';

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

const useHostDetails = (project: string, host: string) =>
  useQuery(`host-details-${project}-${host}`, () =>
    axios.get(`http://localhost:4000/${project}/${host}`),
  );

export async function getServerSideProps(context: any) {
  const { host, project } = context.query;
  //const { data } = useHostDetails(project, host);
  fetch(`http://localhost:4000/${project}/${host}`)
    .then((res) => res.json())
    .then((data) => console.log('logging data', data));
  return { props: { host, project } };
}
