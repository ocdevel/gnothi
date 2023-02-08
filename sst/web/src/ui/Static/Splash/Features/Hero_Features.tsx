import {Section} from "../Home/Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default   function Hero_Features() {
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
          maxWidth={500}
          sx={{
            textAlign: "center", 
            color: colors.white, 
            mt: { xs: 4, sm: 10 }}}
          >
          It's all about the insights
        </Typography>

        <Typography
          variant="h4"
          maxWidth= {500}
          sx={{
            textAlign: "center", 
            color: colors.white}}
        >
          Get more out of your journal with helpful feedback from AI
        </Typography>
      </Stack>

  </Section>
}