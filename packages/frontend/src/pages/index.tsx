import { useQuery, UseQueryResult } from 'react-query';
import axios, { AxiosResponse } from 'axios';
import { Button } from '@mui/material';

const fetchDummyBackend = () => {
  return axios.get('http://localhost:4000');
};
export default function Home() {
  const {
    isError,
    error,
    data,
    refetch,
  }: UseQueryResult<AxiosResponse<any, any>, string> = useQuery(
    'dummy-backend',
    fetchDummyBackend,
    { enabled: false },
  );

  if (isError) {
    return <div>{error}</div>;
  }
  return (
    <main>
      <Button onClick={() => refetch()}>Call endpoint</Button>
      <div>{data?.data}</div>
    </main>
  );
}
