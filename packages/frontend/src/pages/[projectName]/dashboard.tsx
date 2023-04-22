import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  IconButton,
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
import {
  CodeOff as CodeOffIcon,
  Replay as ReplayIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useProjectExists } from '@frontend/pages/[projectName]/runner';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import { useRunCommand } from '@frontend/hooks/useRunCommand';
const fetchCommandExecutions = async (projectName: string | string[] | undefined) => {
  const { data } = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/command-executions`,
  );
  return data;
};

interface CommandExecution {
  projectName: string;
  id: number;
  alias: string;
  success: boolean;
  output: string;
  executionDate: string;
  command: string;
}

interface ChartData {
  [date: string]: {
    date: string;
    errors: number;
    successes: number;
  };
}

const Dashboard = () => {
  const { projectName } = useRouter().query;

  const { data: projectExistsData, isLoading: isProjectExistsLoading } =
    useProjectExists(projectName);

  const projectExists = projectExistsData?.data;
  const [openOutputDialog, setOpenOutputDialog] = useState(false);
  const [commandOutput, setCommandOutput] = useState('');

  const commandExecutionQuery = useQuery(
    'commandExecutions',
    () => {
      if (typeof projectName === 'string') {
        return fetchCommandExecutions(projectName);
      }
    },
    { enabled: projectExists },
  );

  const { data = [], isLoading, isSuccess } = commandExecutionQuery;

  useEffect(() => {
    if (projectExists) {
      commandExecutionQuery.refetch();
    }
  }, [projectExists, commandExecutionQuery]);

  const { runCommand, runningCommandIds, OutputDialog } = useRunCommand();

  if (isLoading || isProjectExistsLoading || !isSuccess) {
    return <LoadingPage />;
  } else if (projectExists === false) {
    return <ProjectNotFound />;
  }
  const handleCloseOutputDialog = () => setOpenOutputDialog(false);
  const handleShowOutputDialog = (output: string) => {
    setCommandOutput(output);
    setOpenOutputDialog(true);
  };

  const chartData = data?.reduce((acc: ChartData, item: CommandExecution) => {
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

  const formattedChartData = Object.values(chartData).reverse();
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
              <TableCell>
                <Typography fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row: CommandExecution) => {
              const { projectName, id, alias, success, output, executionDate, command } = row;
              return (
                <TableRow key={id}>
                  <TableCell>{projectName}</TableCell>
                  <TableCell>{alias}</TableCell>
                  <TableCell>
                    {success ? <DoneIcon color="success" /> : <CloseIcon color="error" />}
                  </TableCell>
                  <TableCell>{new Date(executionDate).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleShowOutputDialog(output)}>
                      <TerminalIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {runningCommandIds.has(id) ? (
                      <CircularProgress size={30} />
                    ) : (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          runCommand(id, alias, projectName, command);
                        }}
                      >
                        <ReplayIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openOutputDialog} onClose={handleCloseOutputDialog} maxWidth="md" fullWidth>
        <Terminal output={commandOutput} />
      </Dialog>
      <OutputDialog />
    </>
  );
};

export default Dashboard;
