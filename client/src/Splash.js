import React from 'react'
import {
  Jumbotron,
  Button,
  Container,
  Row,
  Col,
  Tab,
  Nav
} from 'react-bootstrap'
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
import {Auth, ResetPassword} from "./Auth"
import './Splash.css'
import {
  Switch,
  Route,
  Link,
  useLocation,
  useParams
} from "react-router-dom"
import {LinkContainer} from 'react-router-bootstrap'
import {useSelector} from "react-redux"

function Details() {
  let { tab } = useParams();

  const tabs = React.useMemo(() => [{
    k: 'summaries',
    label: 'Summaries',
    render: () => <>
      <h3>Summarize your entries over custom time periods, in custom lengths</h3>
      <p>It's hard to remember what's happened over the past days, months, years. With summaries you specify how far go to back (eg  2 weeks) and how many words to output (eg, 300 words). Gnothi AI will capture the most essential phrases.</p>
      <img src='/screenshots/summarize.png' />
      <hr />
      <h3>Each entry is summarized</h3>
      <p>When you submit entries, AI generates a title-summary and body-summary, so going through old entries is easier. You can override this per entry.</p>
      <img src='/screenshots/entry.png' style={{padding: 10}} />
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
      <img src='/screenshots/themes.png' />
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
      <img src='/screenshots/ask.png' />
    </>}, {

    k: 'fields',
    label: 'Fields',
    render: () => <>
      <h3>Track fields like "mood" and "sleep"</h3>
      <p>Gnothi lets you track fields - things like mood, sleep. You can also track habits - like exercise, substance intake, daily journaling - but for this I recommend <a href="https://habitica.com" target="_blank">Habitica</a>, which Gnothi syncs with directly.</p>
      <img src='/screenshots/fields.png' />
      <hr />
      <h3>Influencers: field-to-field correlation</h3>
      <p>Gnothi uses time-lagged XGBoost to determine how fields interact with each other. That is: correlation, or "causation" if you're daring. Eg, what most strongly alters my sleep quality? Caffeine? Exercise? This helps you make intelligent life changes.</p>
      <p>Hell, Gnothi's so smart it can predict your field-entries for tomorrow! And of course, fields need charts, graphs, etc. These features will improve over time.</p>
      <img src='/screenshots/fields_charts.png' />
      <hr />
      <h3>Overall Influencers</h3>
      <p>And not just per-field correlations, see which fields are really running the show overall. See "Journal" at the top of my list? This is real, I didn't doctor it - Gnothi's telling me that journaling has impacted my life most of all my habits.</p>
      <img src='/screenshots/fields_top_influencers.png' />
    </>
  }, {
    k: 'sharing',
    label: 'Sharing',
    render: () => <>
      <h3>Share entries with therapists or friends</h3>
      <p>You can share certain features with email addresses. For entries, you'll specify one or more tags, and any entries with that tag will be shared with this person. I'm currently sharing my main journal with my therapist, who uses Gnothi to catch up on me since our last session.</p>
      <img src='/screenshots/sharing.png' style={{padding: 10}}/>
      <hr />
      <h3>Snooper tools</h3>
       <p>For snoopers (the word I use for those you share with), the process goes like this. They get notified of new shared entries. They click your email to see what's up, and they're now "acting" (snooping) as you. They only see what you've explicitly shared with them. If you've shared entries, they can use the AI tools (summaries, question-answering, themes). You might want to share fields with a therapist, if they're interested in substance intake or mood-tracking. And so on.</p>
      <img src='/screenshots/sharing_header.png' />
    </>
  }, {
    k: 'resources',
    label: 'Resources',
    render: () => <>
      <h3>AI-recommended self-help books</h3>
      <p>My favorite feature. Gnothi AI matches your entries to a database of books, based on their descriptions. You can then thumb-up/down recommendations, or save for later, and your recommendations will improve. This feature is really cool AI magic, if you're curious read the following small-print.</p>
      <p><small className={'text-muted'}>Gnothi uses <a href='https://github.com/UKPLab/sentence-transformers' target='_blank'>sentence-transformers</a> to embed your entries into vector-space, does the same for books, and matches them via cosine similarity. <a href='https://huggingface.co/transformers/' target='_blank'>BERT</a> is really a magical thing.</small></p>
      <img src='/screenshots/books.png' style={{padding: 10}}/>
      <hr />
      <h3>AI-recommended therapists</h3>
      <p>Using the same technology above, you can find therapists who match you "in essence" - that is, their specialties (specified in their bio) match your entries via embeddings. Are you a therapist? List yourself now while it's free, you'll be grandfathered once I start charging!</p>
    </>
  }, {
    k: 'faq',
    label: 'FAQ',
    render: () => <>
      <h3>Open source, but you're protected</h3>
      <p>Gnothi is <a href='https://opensource.org/licenses/AGPL-3.0' target='_blank'>AGPL-3.0</a> on <a href='https://github.com/lefnire/gnothi' target='_blank'>Github</a>, with some AI utilities <a href='https://github.com/lefnire/lefnire_ml_utils' target='_blank'>here</a>. Your data is completely locked down, and encrypted! Open-source does not mean open-data, it's just the code. In fact, open-source typically means stronger security, as there's more concerned expert parties' hands on deck.</p>
      <hr />
      <h3>Mobile Apps</h3>
      <p>It would take me 2 weeks total to create an iPhone & Android app. Before I start that, I want to prove this webapp out - make sure people would use Gnothi. This website works great on mobile, so use this in your mobile browser for now. The two main features apps will add are (a) offline capabilities (journal offline, syncs when you're back online); and (b) <a href='https://en.wikipedia.org/wiki/Optical_character_recognition' target='_blank'>OCR</a> to take a photo of your <em>physical</em> journal pages (pen & paper), which gets converted to text & saved to Gnothi. Actually pretty easy using <a href='https://cloud.google.com/functions/docs/tutorials/ocr' target='_blank'>GCP</a>.</p>
      <hr />
      <h3>Bugs/Features</h3>
      <p>Post any bug reports or feature requests to <a href='https://github.com/lefnire/gnothi' target='_blank'>Github</a></p>
    </>
  }])

  return <>
    <Tab.Container activeKey={tab}>
      <Row>
        <Col sm={3}>
          <Nav variant="pills" className="flex-column">
            {tabs.map(t => <Nav.Item key={t.k}>
              <LinkContainer to={`/about/${t.k}`}>
                <Nav.Link>{t.label}</Nav.Link>
              </LinkContainer>
            </Nav.Item>)}
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content className='feature-details'>
            {tabs.map(t => <Tab.Pane eventKey={t.k} key={t.k}>
              {t.render()}
            </Tab.Pane>)}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  </>
}

function Overviews() {
  const features = React.useMemo(() => [{
    k: 'summaries',
    title: <><FaTextHeight /> Summaries</>,
    body: "AI summarizes your entries over days, weeks, months."
  }, {
    k: 'themes',
    title: <><FaCubes /> Themes</>,
    body: "AI shows your recurring themes & issues. Also valuable for dream themes."
  }, {
    k: 'ask',
    title: <><FaQuestion /> Questions</>,
    body: "Ask AI anything about yourself. The answers and insights may surprise you.",
  }, {
    k: 'resources',
    title: <><FaBook /> Resources</>,
    body: "AI recommends self-help books and therapists based on your entries."
  }, {
    k: 'fields',
    title: <><FaSmile /> Field Tracking</>,
    body: "Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on."
  }, {
    k: 'sharing',
    title: <><FaShare /> Share</>,
    body: "Share journals with therapists, who can use all these tools to catch up since your last session."
  }, {
    title: <><FaLock /> Security</>,
    body: "All text is industry-standard encrypted."
  }, {
    title: <><FaRobot /> Future</>,
    body: <p>The sky's the limit with <a target='_blank' href='https://huggingface.co/transformers/'>BERT</a> language models! Astrology? Dream analysis? </p>
  }])

  return <>
    <Row lg={3} sm={2} xs={1}>
      {features.map(f => <Col>
        <h3>{f.title}</h3>
        <p>{f.body}</p>
        {f.k && <>
          <LinkContainer to={`/about/${f.k}`}>
            <Button variant='outline-primary'>Details</Button>
          </LinkContainer>
        </>}
      </Col>)}
    </Row>
  </>
}


export default function Splash() {
  const location = useLocation()
  const error = useSelector(state => state.error)
  const jwt = useSelector(state => state.jwt)
  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)
  return <>
    <Error message={error} />
    <Jumbotron className='gnothi-jumbo'>
      <div className='jumbo-content'>
        <LinkContainer to='/'>
          <div className='jumbo-text cursor-pointer'>
            <img src="/logo192.png" style={{marginLeft: '1rem'}}/>
            <h1>Gnothi</h1>
            <h4>Gnōthi Seauton: Know Thyself</h4>
            <p>A journal that uses AI to help you introspect and find resources</p>
            {showSignin && <>
              <Link to='/auth'>
                <Button>Sign In</Button>
              </Link>
            </>}
          </div>
        </LinkContainer>
        <Switch>
          <Route path='/reset-password'>
            <div className='auth-block'>
              <ResetPassword />
            </div>
          </Route>
          <Route path='/auth'>
            <div className='auth-block'>
              <Auth />
            </div>
          </Route>
        </Switch>
      </div>
    </Jumbotron>
    <Container className='splash-features' fluid>
      <Switch>
        <Route path='/about/:tab'>
          <Details />
        </Route>
        <Route>
          <Overviews />
        </Route>
      </Switch>
    </Container>
  </>
}
