/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Details: Dashboard page for showing executed commands details, with an option to re-execute them
 */

import React from 'react';
import axios, { AxiosResponse } from 'axios';
import { useQuery } from 'react-query';
import {
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Close as CloseIcon, CodeOff as CodeOffIcon, Done as DoneIcon, Replay as ReplayIcon, Terminal as TerminalIcon } from '@mui/icons-material';
import LoadingPage from '@frontend/components/Loading';
import { useRouter } from 'next/router';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import { useRunCommand } from '@frontend/hooks/useRunCommand';
import { ChartData, CommandExecution } from '@frontend/types';
import { useProjectExists } from '@frontend/hooks/useProjectExists';
import { BE_BASE_URL, NOT_FOUND_ICON_SX } from '@frontend/constants';
import TerminalDialog from '@frontend/components/TerminalDialog';

const fetchCommandExecutions = async (projectName: string | string[] | undefined): Promise<CommandExecution[]> => {
  const response: AxiosResponse<any> = await axios.get(`${BE_BASE_URL}/${projectName}/command-executions`);
  return response.data;
};

const Dashboard = () => {
  const { projectName } = useRouter().query;

  const { data: projectExistsData, isLoading: isProjectExistsLoading } = useProjectExists(projectName);

  const projectExists = projectExistsData?.data;

  const commandExecutionQuery = useQuery(
    ['commandExecutions', projectName],
    () => {
      if (typeof projectName === 'string') {
        return fetchCommandExecutions(projectName);
      }
    },
    { enabled: projectExists },
  );

  const { data = [], isLoading, isSuccess } = commandExecutionQuery;

  const { runCommand, runningCommandIds, commandOutput, setCommandOutput, handleCloseOutputDialog, handleOpenOutputDialog, openOutputDialog } =
    useRunCommand(() => commandExecutionQuery.refetch());

  if (isLoading || isProjectExistsLoading || !isSuccess) {
    return <LoadingPage />;
  } else if (projectExists === false) {
    return <ProjectNotFound />;
  }

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
        <CodeOffIcon sx={NOT_FOUND_ICON_SX} />
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
      <TableContainer component={Paper} style={{ maxHeight: 'calc(100% - 300px)', overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
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
              const { id, alias, success, output, executionDate, command } = row;
              return (
                <TableRow key={id}>
                  <TableCell>{alias}</TableCell>
                  <TableCell>{success ? <DoneIcon color="success" /> : <CloseIcon color="error" />}</TableCell>
                  <TableCell>{new Date(executionDate).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton
                      id="button-show-output"
                      onClick={() => {
                        setCommandOutput(output);
                        handleOpenOutputDialog();
                      }}
                    >
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
      <TerminalDialog output={commandOutput} open={openOutputDialog} onClose={handleCloseOutputDialog} />
    </>
  );
};

export default Dashboard;
