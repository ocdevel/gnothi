import React from 'react'
import {
  FaTextHeight,
  FaRobot,
  FaShare,
  FaLock,
  FaQuestion,
  FaCubes,
  FaBook,
  FaSmile
} from 'react-icons/fa'
import Error from "./Error";
import {Authenticate, ResetPassword} from "./Auth"
import './Splash.css'
import {
  Switch,
  Route,
  Link,
  useLocation,
  useParams, useHistory
} from "react-router-dom"
import {LinkContainer} from 'react-router-bootstrap'
import AmplifyAuth from './Account/AmplifyAuth'
import Grid from '@material-ui/core/Grid'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {useStoreActions, useStoreState} from 'easy-peasy'
import _ from 'lodash'
import { useTheme } from '@material-ui/core/styles';
import {useMediaQuery} from "react-responsive";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    // flexGrow: 1,
    // display: 'flex',
    // width: '100%'
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const imgStyle = {
  padding: 10,
  // width: '100%',
  maxWidth: 768,
  margin: '0px auto'
}

const tabs = [{
  k: 'summaries',
  label: 'Summaries',
  render: () => <>
    <h3>Summarize your entries over custom time periods, in custom lengths</h3>
    <p>It's hard to remember what's happened over the past days, months, years. With summaries you specify how far go to back (eg  2 weeks) and how many words to output (eg, 300 words). Gnothi AI will capture the most essential phrases.</p>
    <img src='/screenshots/summarize.png' style={imgStyle}/>
    <hr />
    <h3>Each entry is summarized</h3>
    <p>When you submit entries, AI generates a title-summary and body-summary, so going through old entries is easier. You can override this per entry.</p>
    <img src='/screenshots/entry.png' style={imgStyle}/>
    <hr />
    <h3>Especially useful for therapists</h3>
    <p>If you choose to share specified journals with a therapist (see <Link to='/about/sharing'>Sharing</Link>), they'll be able to generate summaries since your last session for a quick catch-up / digest.</p>
  </>
}, {
  k: 'themes',
  label: 'Themes',
  render: () => <>
    <h3>See common recurring themes across your entries</h3>
    <p>Our lives are often vexed by a handful of the same recurring issues. You might not even be aware of these, until you step back and see the same topics repeated over the past months and years.</p>
    <img src='/screenshots/themes.png' style={imgStyle}/>
    <hr/>
    <h3>Dreams!</h3>
    <p>But it's not all issues and problems, you may find yourself dreaming of the same few symbols multiple months. I didn't realize I dreamt so much of <strong>turtles</strong> until Gnothi Themes pointed it out. I immediately hit the dream dictionary.</p>
  </>
}, {
  k: 'ask',
  label: 'Questions',
  render: () => <>
    <h3>Ask questions about your entries</h3>
    <p>Gnothi AI lets you ask questions of your entries. "How do I feel?" or "what should I do?". The answers have often surprised me. Particularly useful for therapists, who can treat this like a knowledge-base on their client. "What is Tyler's relation with his mother?" or "Who is Lara?"</p>
    <img src='/screenshots/ask.png' style={imgStyle}/>
  </>}, {

  k: 'fields',
  label: 'Fields',
  render: () => <>
    <h3>Track fields like "mood" and "sleep"</h3>
    <p>Gnothi lets you track fields - things like mood, sleep. You can also track habits - like exercise, substance intake, daily journaling - but for this I recommend <a href="https://habitica.com" target="_blank">Habitica</a>, which Gnothi syncs with directly.</p>
    <img src='/screenshots/fields.png' style={imgStyle} />
    <hr />
    <h3>Influencers: field-to-field correlation</h3>
    <p>Gnothi uses time-lagged XGBoost to determine how fields interact with each other. That is: correlation, or "causation" if you're daring. Eg, what most strongly alters my sleep quality? Caffeine? Exercise? This helps you make intelligent life changes.</p>
    <p>Hell, Gnothi's so smart it can predict your field-entries for tomorrow! And of course, fields need charts, graphs, etc. These features will improve over time.</p>
    <img src='/screenshots/fields_charts.png' style={imgStyle}/>
    <hr />
    <h3>Overall Influencers</h3>
    <p>And not just per-field correlations, see which fields are really running the show overall. See "Journal" at the top of my list? This is real, I didn't doctor it - Gnothi's telling me that journaling has impacted my life most of all my habits.</p>
    <img src='/screenshots/fields_top_influencers.png' style={imgStyle}/>
  </>
}, {
  k: 'sharing',
  label: 'Sharing',
  render: () => <>
    <h3>Share entries with therapists or friends</h3>
    <p>You can share certain features with email addresses. For entries, you'll specify one or more tags, and any entries with that tag will be shared with this person. I'm currently sharing my main journal with my therapist, who uses Gnothi to catch up on me since our last session.</p>
    <img src='/screenshots/sharing.png' style={imgStyle}/>
    <hr />
    <h3>Snooper tools</h3>
     <p>For snoopers (the word I use for those you share with), the process goes like this. They get notified of new shared entries. They click your email to see what's up, and they're now "acting" (snooping) as you. They only see what you've explicitly shared with them. If you've shared entries, they can use the AI tools (summaries, question-answering, themes). You might want to share fields with a therapist, if they're interested in substance intake or mood-tracking. And so on.</p>
    <img src='/screenshots/sharing_header.png' style={imgStyle} />
  </>
}, {
  k: 'resources',
  label: 'Resources',
  render: () => <>
    <h3>AI-recommended self-help books</h3>
    <p>My favorite feature. Gnothi AI matches your entries to a database of books, based on their descriptions. You can then thumb-up/down recommendations, or save for later, and your recommendations will improve. This feature is really cool AI magic, if you're curious read the following small-print.</p>
    <p><small className={'text-muted'}>Gnothi uses <a href='https://github.com/UKPLab/sentence-transformers' target='_blank'>sentence-transformers</a> to embed your entries into vector-space, does the same for books, and matches them via cosine similarity. <a href='https://huggingface.co/transformers/' target='_blank'>BERT</a> is really a magical thing.</small></p>
    <img src='/screenshots/books.png' style={imgStyle}/>
    <hr />
    <h3>AI-recommended therapists</h3>
    <p>Using the same technology above, you can find therapists who match you "in essence" - that is, their specialties (specified in their bio) match your entries via embeddings. Are you a therapist? List yourself now while it's free, you'll be grandfathered once I start charging!</p>
  </>
}, {
  k: 'https://github.com/lefnire/gnothi/issues?q=label%3AFAQ',
  label: 'FAQ',
  render: () => <></>
}]

function Details() {
  const desktop = useMediaQuery({ minWidth: 1280 })

  let { tab } = useParams();
  const history = useHistory()
  tab = _.findIndex(tabs, {k: tab})
  const classes = useStyles();

  function onChange(e, i) {
    const t = tabs[i].k
    if (_.startsWith(t, 'http')) {
      window.open(t, '_blank')
    } else {
      history.push(`/about/${t}`)
    }
  }

  return <Grid container spacing={3}>
    <Grid item xs={12} lg={2}>
      <Tabs
        orientation={desktop ? "vertical" : "horizontal"}
        variant="scrollable"
        value={tab}
        onChange={onChange}
        aria-label="Tabs"
        className={classes.tabs}
        sx={{mb:2}}
      >
        {tabs.map((t, i) => <Tab
          key={i}
          label={t.label}
          id={`vertical-tab-${i}`}
          aria-controls={`vertical-tabpanel-${i}`}
        />)}
      </Tabs>
    </Grid>
    <Grid item xs={12} lg={9}>
      {tabs[tab].render()}
    </Grid>
  </Grid>
}

const features = [{
  k: 'summaries',
  icon: <FaTextHeight />,
  title: "Summaries",
  body: "AI summarizes your entries over days, weeks, months."
}, {
  k: 'themes',
  icon: <FaCubes />,
  title: "Themes",
  body: "AI shows your recurring themes & issues. Also valuable for dream themes."
}, {
  k: 'ask',
  icon: <FaQuestion />,
  title: "Questions",
  body: "Ask AI anything about yourself. The answers and insights may surprise you.",
}, {
  k: 'resources',
  icon: <FaBook />,
  title: "Resources",
  body: "AI recommends self-help books and therapists based on your entries."
}, {
  k: 'fields',
  icon: <FaSmile />,
  title: "Field Tracking",
  body: "Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on."
}, {
  k: 'sharing',
  icon: <FaShare />,
  title: "Share",
  body: "Share journals with therapists, who can use all these tools to catch up since your last session."
}, {
  icon: <FaLock />,
  title: "Security",
  body: "All text is industry-standard encrypted."
}, {
  icon: <FaRobot />,
  title: "Future",
  body: <>The sky's the limit with <a target='_blank' href='https://huggingface.co/transformers/'>BERT</a> language models! Astrology? Dream analysis? </>
}]

function Overviews() {
  return features.map((f, i) => <Grid
    item
    key={i}
    xs={12} sm={6} lg={4}

  >
    <Card>
      <CardHeader title={
        <Grid container alignItems='center' spacing={2}>
          <Grid item>{f.icon}</Grid>
          <Grid item>{f.title}</Grid>
        </Grid>
      } />
      <CardContent sx={{minHeight: 100}}>
        <Typography>{f.body}</Typography>
      </CardContent>
      <CardActions>
        {f.k && <Button
          to={`/about/${f.k}`}
          component={Link}
          sx={{ml: 'auto'}}
          variant='outlined'
          color='primary'
        >Details</Button>}
      </CardActions>
    </Card>
  </Grid>)
}


export default function Splash() {
  const location = useLocation()
  const error = useStoreState(state => state.server.error)
  const jwt = useStoreState(state => state.user.jwt)
  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)
  return <>
    <Error message={error} />
    <Paper
      elevation={0}
      square
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        py: 5,
        mb: 4,
        backgroundColor: '#e9ecef',
      }}
    >
      <LinkContainer to='/'>
        <header className='cursor-pointer'>
          <img src="/logo192.png" style={{marginLeft: '1rem'}}/>
        </header>
      </LinkContainer>
      <Typography variant='h3' component='h1'>Gnothi</Typography>
      <Typography variant='h5'>Gnōthi Seauton: Know Thyself</Typography>
      <Typography>A journal that uses AI to help you introspect and find resources</Typography>
      {showSignin && <>
        <Link to='/auth'>
          <Button>Sign In</Button>
        </Link>
      </>}
      <Switch>
        {/*<Route path='/reset-password'>
          <div className='auth-block'>
            <ResetPassword />
          </div>
        </Route>*/}
        <Route path='/auth' exact>
          <div className='custom-amplify-container'>
            <AmplifyAuth />
          </div>
        </Route>
        <Route path='/auth/old'>
          <div className='auth-block'>
            <Authenticate />
          </div>
        </Route>
      </Switch>
    </Paper>
    <Switch>
      <Route path='/about/:tab'>
        <Details />
      </Route>
      <Route>
        <Grid container spacing={4}>
          <Overviews />
          <Grid item xs={12}><Divider /></Grid>
          <Grid
            item container
            direction='column'
            alignItems='center'
            justifyContent='center'
          >
            <Grid item>
              <Typography variant="body2">
                Croesus inquired of the oracle what to do to live a happy life. The answer was:<br/>
                "Know yourself, O Croesus - thus you will live and be happy."
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">
                <em>- (Xenophon, Cyropaedia)</em>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Route>
    </Switch>
  </>
}
