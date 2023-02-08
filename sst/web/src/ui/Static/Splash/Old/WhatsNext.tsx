import {Section} from "../Home/Utils";
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
        variant="h2"
        sx={{textAlign: "center", maxWidth: 1004}}
        >
        TBD
        </Typography>

        <Typography
          sx={{textAlign: "center", maxWidth: 1004}}
          >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer orci magna, tincidunt id interdum sed, auctor at libero. Morbi iaculis ligula ut mi tristique pretium. In vehicula auctor massa eu ultricies. Sed at nibh in risus porttitor ullamcorper.        
          </Typography>

      <Stack direction="row" spacing={spacing.sm} mt={spacing.lg}>
        <Skeleton variant="rectangular" width={590} height={400} />
        <Skeleton variant="rectangular" width={590} height={400} />
      </Stack>
    </Stack>
  </Section>
}
