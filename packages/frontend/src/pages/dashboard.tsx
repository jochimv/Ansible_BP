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

import Terminal from '@frontend/components/Terminal';
import LoadingPage from '@frontend/components/pages/Loading';
const fetchCommandExecutions = async () => {
  const { data } = await axios.get('http://127.0.0.1:4000/command-executions');
  return data;
};

const Dashboard = () => {
  const [openOutputDialog, setOpenOutputDialog] = useState(false);
  const [commandOutput, setCommandOutput] = useState('');
  const { data, isLoading, error } = useQuery('commandExecutions', fetchCommandExecutions);

  const handleCloseOutputDialog = () => setOpenOutputDialog(false);
  const handleShowOutputDialog = (output) => {
    setCommandOutput(output);
    setOpenOutputDialog(true);
  };

  if (isLoading) return <LoadingPage />;

  const chartData = data.reduce((acc, item) => {
    const date = new Date(item.executionDate);
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    if (!acc[dateString]) {
      acc[dateString] = { date: dateString, errors: 0, successes: 0 };
    }

    if (item.error) {
      acc[dateString].errors += 1;
    } else {
      acc[dateString].successes += 1;
    }

    return acc;
  }, {});

  const formattedChartData = Object.values(chartData);

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="errors" stroke="#FF5733" />
          <Line type="monotone" dataKey="successes" stroke="#33C2FF" />
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
                <Typography fontWeight="bold">Error</Typography>
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
                <TableCell>{row.error ? 'Yes' : 'No'}</TableCell>
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
