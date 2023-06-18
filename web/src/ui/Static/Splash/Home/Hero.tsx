import {Section} from "./Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {styles} from '../../../Setup/Mui';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
const {spacing, colors, sx} = styles

export default   function Hero() {
  return <Section color="dark">
    <Grid mt={5} mb={5}>
        <Typography
          variant="h1"
          textAlign={'center'}
          sx={{
            color: colors.white,
            }}
          >
          Know thyself with Gnothi
        </Typography>
        <Typography
          variant="h4"
          textAlign={'center'}
          sx={{
            color: colors.white}}
        >
          An AI-powered journal and toolkit for a healthy and happy life
        </Typography>
    </Grid>

  </Section>
}
