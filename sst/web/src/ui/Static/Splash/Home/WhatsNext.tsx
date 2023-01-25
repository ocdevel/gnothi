import {Section} from "./Utils";
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default function WhatsNext() {
  return <Section color='grey'>
    <Stack
      justifyContent="center"
      alignItems="center"
    >
      <Typography
        variant="h3"
        sx={{textAlign: "center", maxWidth: 1004}}
      >We’re a small company, but we’re doing big things</Typography>
      <Typography
        sx={{textAlign: "center", maxWidth: 1004}}
      >Gnothi beta was launched in 2019 and, without any marketing, has supported about 5,000 people. There’s something here. It’s helping people, and we hope to do a lot more of that. Here’s a sneak peak at what we’re working on.</Typography>
      <Stack direction="row" spacing={spacing.sm} mt={spacing.lg}>
        <Skeleton variant="rectangular" width={590} height={400} />
        <Skeleton variant="rectangular" width={590} height={400} />
      </Stack>
    </Stack>
  </Section>
}
