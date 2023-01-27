import {Section} from "./Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default   function Hero() {
  return <Section color="dark">
      <Stack
        spacing={2}
        sx={{
          display: "flex",
          direction: "column",
          alignItems: "center",
        }}>
        <Typography
          variant="h1"
          sx={{
            textAlign: "center", 
            color: colors.white, 
            mt: { xs: 4, sm: 10 }}}
          >
          Know thyself with Gnothi
        </Typography>

        <Typography
          variant="h4"
          maxWidth= {500}
          sx={{
            textAlign: "center", 
            color: colors.white}}
        >
          An AI-powered journal and toolkit for a healthy and happy life
        </Typography>
      </Stack>

  </Section>
}
