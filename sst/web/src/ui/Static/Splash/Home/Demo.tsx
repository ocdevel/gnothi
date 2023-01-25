import {Section} from "./Utils";
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default function Demo() {
    return <Section color="light">
      <Grid container
        direction="row"
        spacing={spacing.lg}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12} md={6}>
          <Stack
            justifyContent="center"
            spacing={spacing.sm}
            sx={{maxWidth: 500}}
          >
            <Typography variant="h3" >See the AI in action</Typography>
            <Typography>
              Most of the features are completely free. The goal is to provide a platform that prioritizes mental health. Whether you sign up for a free account or Gnothi Premium, there’s a lot to offer and much more to come.
            </Typography>
            <Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "primary.main",
                  color: colors.white,
                  marginTop: '1rem'
                }}
              >
                Watch a demo
              </Button>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton animation="wave" variant="rectangular" width={590} height={400} />
        </Grid>
      </Grid>
    </Section>
  }
