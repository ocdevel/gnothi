import {Section} from "../Home/Utils";
import {styles} from '../../../Setup/Mui'

const {spacing, colors, sx} = styles
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {padding} from "@mui/system";
import {useStore} from '../../../../data/store'
import {shallow} from "zustand/shallow";

export default function PremPricingCTA() {
  const [me] = useStore(s => [s.user?.me], shallow)
  if (me) {return null}
  return <Section color="grey">
    <Box
      sx={{
        backgroundColor: "primary.main",
        borderRadius: 10,
        paddingTop: 10,
        paddingBottom: 10,
        px: 50
      }}
    >

      <Grid container
            direction="column"
            alignItems="center"
            justifyContent="center">

        <Grid item xs={12}>

          <Typography
            variant="h2"
            textAlign='center'
            sx={{
              color: colors.white
            }}
          >
            Start your journey today
          </Typography>

          <Typography
            variant="h4"
            textAlign='center'
            sx={{
              color: colors.white
            }}
          >
            Join Gnothi with a free or premium account
          </Typography>
        </Grid>

        <Grid>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "white",
              color: colors.black,
              marginTop: '2rem',
            }}
          >
            Sign up
          </Button>
        </Grid>
      </Grid>

    </Box>
  </Section>
}
