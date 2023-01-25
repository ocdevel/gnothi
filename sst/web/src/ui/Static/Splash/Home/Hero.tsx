import {Section} from "./Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default   function Hero() {
  return <Section color="dark">
    <Stack
      alignItems="center"
      justifyContent="center"
    >
      <Stack sx={{maxWidth: 900,}} alignItems="center">
        <Typography
          variant="h1"
          sx={{textAlign: "center", color: colors.white, paddingBottom: spacing.md, paddingTop: spacing.sm}}
        >
          Know thyself with Gnothi
        </Typography>

      </Stack>
      <Stack sx={{maxWidth: 500}} alignItems="center">
        <Typography
          variant="h4"
          sx={{textAlign: "center", color: colors.white, paddingBottom: spacing.md}}
        >
          An AI-powered journal and toolkit for a healthy and happy life
        </Typography>
      </Stack>
    </Stack>
  </Section>
}
