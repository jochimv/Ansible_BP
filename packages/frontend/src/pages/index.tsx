import { useQuery } from "react-query";
import axios from "axios";
import { Button } from "@mui/material";

const fetchDummyBackend = () => {
  return axios.get("http://localhost:4000");
};
export default function Home() {
  const { isError, error, data, refetch } = useQuery(
    "dummy-backend",
    fetchDummyBackend,
    { enabled: false }
  );

  return (
    <main>
      <Button onClick={() => refetch()}>Call endpoint</Button>
      <div>{data?.data}</div>
      <div>Hello</div>
    </main>
  );
}
