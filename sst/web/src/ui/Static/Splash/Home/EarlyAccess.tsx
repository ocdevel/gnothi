import {Section} from "./Utils";
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export default function EarlyAccess() {
  return <Section color="light">
    <Grid container
      direction="row"
      spacing={spacing.lg}
      alignItems="center"
      justifyContent="center"
    >

      <Grid item xs={12} md={6}>
        <Skeleton animation="wave" variant="rectangular" width={590} height={400} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack
          justifyContent="center"
          spacing={spacing.sm}
          sx={{maxWidth: 500}}
        >
          <Typography variant="h3" justifyContent={'left'}>Get early access to experimental features</Typography>
          <Typography>
          Gnothi is an open source, community-focused project. If you want to support us and get access to experimental features, join the waitlist.            </Typography>
          <Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "primary.main",
                color: colors.white,
                marginTop: '1rem'
              }}
            >
              Join the waitlist
            </Button>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  </Section>
}
