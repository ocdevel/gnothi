import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useMediaQuery} from "react-responsive";
import {useNavigate, useParams} from "react-router-dom";
import _ from "lodash";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {Link} from '@gnothi/web/src/ui/Components/Link'

interface TabPanel {
  value: number
  index: number
  children?: React.ReactNode
}
function TabPanel(props: TabPanel) {
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

// const useStyles = makeStyles((theme) => ({
//   root: {
//     // flexGrow: 1,
//     // display: 'flex',
//     // width: '100%'
//   },
//   tabs: {
//     borderRight: `1px solid ${theme.palette.divider}`,
//   },
// }));

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
    <p>If you choose to share specified journals with a therapist (see <Link.Anchor to='/about/sharing'>Sharing</Link.Anchor>), they'll be able to generate summaries since your last session for a quick catch-up / digest.</p>
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
    <p><small className={'text-muted'}>Gnothi uses <a href='https://github.com/UKPLab/sentence-transformers' target='_blank'>sentence-transformers</a> to embed your entries into vector-space, does the same for books, and matches them via cosine similarity. <a href='FIXME' target='_blank'>BERT</a> is really a magical thing.</small></p>
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

export default function Details() {
  const desktop = useMediaQuery({ minWidth: 1280 })

  let { tab: tab_ } = useParams();
  const navigate = useNavigate()
  const tab = _.findIndex(tabs, {k: tab_})
  // const classes = useStyles();
  const classes = {tabs: ""} // FIXME

  function onChange(e: React.SyntheticEvent, i: number) {
    const t = tabs[i].k
    if (_.startsWith(t, 'http')) {
      window.open(t, '_blank')
    } else {
      navigate(`/about/${t}`)
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
