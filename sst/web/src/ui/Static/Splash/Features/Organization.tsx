import { Section, Skeleton2, Skeleton4 } from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styles } from '../../../Setup/Mui';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';


const { spacing, colors, sx } = styles

export default function Organization() {
  return <Section color="grey">

    <Box
      sx={{
        borderBottomStyle: 'solid',
        borderBottomColor: "secondary.main",
        borderBottomWidth: '1.5px',

        paddingBottom: 10
      }}>
      <Grid container
        direction="row"
        spacing={4}
        alignItems="center"
        justifyContent="center"
      >

        <Grid item xs={12}>
          <Box
            display="flex"
            justifyContent="flex-end"
            mb={2}>
            <FolderOpenOutlinedIcon sx={sx.organizationIconLg} />
          </Box>
          <Typography
            variant="subtitle1"
            textAlign="right"
            paddingBottom={4}
            color='#696B38'
            fontWeight={600}
          >
            Organize entries with custom tags and settings
          </Typography>
        </Grid>


        <Grid item xs={12} md={5}>
          <Skeleton4 />
        </Grid>


        <Grid container item
          direction="column"
          spacing={2} xs={12} md={5}
        >

          <Grid item xs={12}>
            <Typography
              variant="h6"
              textAlign="left"
              color='#696B38'
            >
              Magic Search
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography>
              Your subconscious uses dreams to tap you on the shoulder and get important information to you. Find out what your dreams mean.
            </Typography>
          </Grid>
        </Grid>




        <Grid item xs={12} md={5}>
          <Grid container
            direction="column"
            spacing={2}
          >
            <Grid item xs={12}>
              <Typography
                variant="h6"
                textAlign="left"
                color='#696B38'
              >
                Themes & Summaries
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
                Even a simple entry about your day can be a jumping off point for a much deeper exploration of yourself. Get to the heart of what’s going on.
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={5}>
          <Skeleton4 />
        </Grid>



        <Grid item xs={12} md={5}>
          <Skeleton4 />
        </Grid>


        <Grid item xs={12} md={5}>
          <Grid container
            direction="column"
            spacing={2}
          >
            <Grid item xs={12}>
              <Typography
                variant="h6"
                textAlign="left"
                color='#696B38'
              >
                Create and filter with tags
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
                The quality of our relationships have a tremendous impact on our lives. Strengthen the connections that are important to you, and navigate challenges more effectively.
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={5} id="share">
          <Grid container
            direction="column"
            spacing={2}
          >
            <Grid item xs={12}>
              <Typography
                variant="h6"
                textAlign="left"
                color='#696B38'
              >
                Share with friends or therapists
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
                The quality of our relationships have a tremendous impact on our lives. Strengthen the connections that are important to you, and navigate challenges more effectively.
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={5}>
          <Skeleton4 />
        </Grid>

      </Grid>
    </Box>
  </Section>
}