import {FeatureCard, Section} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
import {Link} from '../../../Components/Link'
import GroupsIcon from '@mui/icons-material/Groups';
import BookIcon from '@mui/icons-material/AutoStories';
import SecureIcon from "@mui/icons-material/Lock"
import InsightsIcon from '@mui/icons-material/AutoFixHigh';
import TherapyIcon from '@mui/icons-material/Chair';
import ShareIcon from '@mui/icons-material/Share';
const {spacing, colors, sx} = styles

export default function NewJournal() {
  return <Section color="grey">
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={spacing.lg}
      sx={{paddingBottom: spacing.lg}}
    >
      <Stack
        alignItems={'center'}>
      <Typography
        variant="h3"
        align='center'
      >
        A new kind of journal...
      </Typography>
      <Typography
        sx={{textAlign: "center", maxWidth: 950}}
      >
        Gnothi uses a variety of cutting-edge machine learning models that make connections between what you’re writing, how you’re feeling, and your daily habits. That’s where most of us get stuck and overwhelmed. Gnothi helps you narrow your focus so you can navigate your journey of self-discovery with more awareness and direction.
        </Typography>
      </Stack>
      <Link.Button
        variant='contained'
        sx={{backgroundColor: "primary.main", color: colors.white, width: 360,}}
        to="/features"
      >
        Explore the features
      </Link.Button>
    </Stack>
    <Grid
      container
      px='10'
      spacing={4}
      justifyContent="center"
      alignItems="stretch"
    >
      <FeatureCard
        icon={<SecureIcon sx={sx.featureIcon} />}
      >
       Rest easy knowing that your entries are secure
      </FeatureCard>
      <FeatureCard
        icon={<InsightsIcon sx={{...sx.featureIcon, ml: 1}} />}
      >
        Get AI-generated insights to help you grow
      </FeatureCard>
      <FeatureCard
        icon={<TherapyIcon sx={sx.featureIcon} />}
      >
       Use it in therapy to get the most from sessions
      </FeatureCard>
      <FeatureCard
        icon={<ShareIcon sx={sx.featureIcon} />}
      >
        Share entries with friends to stay connected
      </FeatureCard>
      <FeatureCard
        icon={<BookIcon sx={sx.featureIcon} />}
      >
        Read books recommended by AI just for you
      </FeatureCard>
      <FeatureCard
        icon={<GroupsIcon sx={sx.featureIcon} />}
      >
        Create and join groups for support (coming soon)
      </FeatureCard>
    </Grid>
  </Section>
}
