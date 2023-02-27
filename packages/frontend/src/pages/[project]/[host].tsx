import { Typography } from '@mui/material';

interface HostPageProps {
  host: string;
  project: string;
}

const HostPage = ({ host, project }: HostPageProps) => {
  return (
    <div>
      <Typography variant="h3">{host}</Typography>
      <Typography variant="h5">{project}</Typography>
    </div>
  );
};

export default HostPage;

export async function getServerSideProps(context: any) {
  const { host, project } = context.query;
  return { props: { host, project } };
}
