import { Section, Skeleton2, Skeleton4 } from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styles } from '../../../Setup/Mui';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import { FeatureIntro } from "../Utils";
import MagicSearchIcon from '@mui/icons-material/SavedSearchOutlined';


const { spacing, colors, sx } = styles
const iconProps = {sx: sx.featureIcon}
const featureProps = {color: sx.featureIcon.color}

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
            Easily organize, share, and find your entries
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
              Magic Search: Find entries and ask questions
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography>
            Super-charged by AI, Magic Search makes it easy to ask your journal questions and get optimized search results for any keyword related to past entries. 
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
              Sharing: Get support and share your story 
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
              This is a valuable feature to make use of if you want to share certain entries with friends or therapists, while keeping other parts of your journal completely private. 
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
                Tagging: Create custom tags to quickly filter entries
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
              Organize your thoughts in a way that makes sense for you. Common tags include, work, dreams, big life events, relationships, etc. Tags are also used for sharing entries. 
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
                Create bios for yourself and the people in your life
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography>
              Write a sentence or two about the important people in your life, and the AI will use this info as context for even more personalized insights and search results. 
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