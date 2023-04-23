import {CircularProgress, Stack, Typography} from "@mui/material";


const LoadingPage = () => (<Stack display="flex" direction="column" justifyContent="center" alignItems="center" spacing={4} sx={{ height: '100%' }}>
    <CircularProgress size={150}/>
    <Typography variant="h3">Loading...</Typography>
</Stack>)


export default LoadingPage;