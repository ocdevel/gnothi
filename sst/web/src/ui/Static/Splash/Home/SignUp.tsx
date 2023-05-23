import {Section} from "./Utils";
import {styles} from '../../../Setup/Mui'

const {spacing, colors, sx} = styles
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {padding} from "@mui/system";
import {useLocalStore} from '../store'

export default function SignUp() {
  const setAuthTab = useLocalStore(state => state.setAuthTab)

  return <Section color="dark">
    <Stack
      direction='column'
      sx={{
        display: 'flex',
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Typography
        variant="h2"
        textAlign='center'
        sx={{
          color: colors.white
        }}
      >
        Get started on your journey
      </Typography>

      <Typography
        variant="h4"
        textAlign='center'
        sx={{
          color: colors.white
        }}
      >
        Create a free account today
      </Typography>

      <Button
        variant="contained"
        sx={{
          backgroundColor: "white",
          color: colors.black,
          marginTop: '2rem',
        }}
        onClick={() => setAuthTab("signUp")}
      >
        Sign Up
      </Button>

    </Stack>
  </Section>
}
