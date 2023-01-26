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
  return <Section color="light">
    <Stack
      direction='column'
      sx={{ display: 'flex', justifyContent: "center", alignItems: "center"}}
      >
        <Typography 
        variant="h2" 
        >
        Start writing and exploring today            
        </Typography>

        <Typography 
        variant="h4" 
        >
        Create a free account or sign up for Gnothi Premium        
        </Typography>

        <Button
        variant="contained"
        sx={{
        backgroundColor: "primary.main",
        color: colors.white,
        marginTop: '2rem',
        }}
        >
        Sign up
        </Button>
       
    </Stack>
  </Section>
}
