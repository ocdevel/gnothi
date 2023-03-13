import {Section} from "./Utils";
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { padding } from "@mui/system";

export default function SignUp() {
  return <Section color="dark">
    <Stack
      direction='column'
      sx={{ 
        display: 'flex', 
        justifyContent: "center", 
        alignItems: "center"}}
      >
        <Typography 
        variant="h2" 
        textAlign='center'
        sx={{
          color: colors.white}}
        >
        Get started on your journey today            
        </Typography>

        <Typography 
        variant="h4" 
        textAlign='center'
        sx={{
          color: colors.white}}
        >
        Create a free account or join Gnothi Premium        
        </Typography>

        <Button
        variant="contained"
        sx={{
        backgroundColor: "white",
        color: colors.black,
        marginTop: '2rem',
        }}
        >
        Explore plans
        </Button>
       
    </Stack>
  </Section>
}
