import React, { useState } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  Typography,
  Stack,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Close as CloseIcon, Done as DoneIcon } from '@mui/icons-material';
import Terminal from '@frontend/components/Terminal';
import LoadingPage from '@frontend/components/pages/Loading';
import { CodeOff as CodeOffIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useProjectExists } from '@frontend/pages/[projectName]/runner';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
const fetchCommandExecutions = async (projectName: string | string[] | undefined) => {
  const { data } = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/command-executions`,
  );
  return data;
};

const Dashboard = () => {
  const { projectName } = useRouter().query;

  const { data: projectExistsData, isLoading: isProjectExistsLoading } =
    useProjectExists(projectName);

  const [openOutputDialog, setOpenOutputDialog] = useState(false);
  const [commandOutput, setCommandOutput] = useState('');
  const {
    data = [],
    isLoading,
    isSuccess,
  } = useQuery('commandExecutions', () => {
    if (typeof projectName === 'string') {
      return fetchCommandExecutions(projectName);
    }
  });

  if (isLoading || isProjectExistsLoading || !isSuccess) {
    return <LoadingPage />;
  } else if (!projectExistsData?.data) {
    return <ProjectNotFound />;
  }
  const handleCloseOutputDialog = () => setOpenOutputDialog(false);
  const handleShowOutputDialog = (output: string) => {
    setCommandOutput(output);
    setOpenOutputDialog(true);
  };

  const chartData = data?.reduce((acc, item) => {
    const date = new Date(item.executionDate);
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    if (!acc[dateString]) {
      acc[dateString] = { date: dateString, errors: 0, successes: 0 };
    }

    if (item.success) {
      acc[dateString].successes += 1;
    } else {
      acc[dateString].errors += 1;
    }

    return acc;
  }, {});
  const formattedChartData = Object.values(chartData);
  if (formattedChartData.length === 0) {
    return (
      <Stack height="100%" justifyContent="center" alignItems="center">
        <CodeOffIcon sx={{ width: 50, height: 50 }} />
        <Typography variant="h3">No commands executed yet</Typography>
      </Stack>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            style={{
              fontFamily: 'Roboto',
            }}
          />
          <YAxis
            allowDecimals={false}
            style={{
              fontFamily: 'Roboto',
            }}
          />
          <Tooltip />
          <Legend
            style={{
              fontFamily: 'Roboto',
            }}
          />
          <Line type="monotone" dataKey="errors" stroke="#d32f2f" />
          <Line type="monotone" dataKey="successes" stroke="#2e7d32" />
        </LineChart>
      </ResponsiveContainer>
      <TableContainer
        component={Paper}
        style={{ maxHeight: 'calc(100% - 300px)', overflow: 'auto' }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography fontWeight="bold">Project Name</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight="bold">Alias</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight="bold">Success</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight="bold">Execution Date</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight="bold">Output</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.projectName}</TableCell>
                <TableCell>{row.alias}</TableCell>
                <TableCell>
                  {row.success ? <DoneIcon color="success" /> : <CloseIcon color="error" />}
                </TableCell>
                <TableCell>{new Date(row.executionDate).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleShowOutputDialog(row.output)}>
                    View Output
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openOutputDialog} onClose={handleCloseOutputDialog} maxWidth="md" fullWidth>
        <Terminal output={commandOutput} />
      </Dialog>
    </>
  );
};

export default Dashboard;
