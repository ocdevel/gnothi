import {FaBook, FaCubes, FaLock, FaQuestion, FaRobot, FaShare, FaSmile, FaTextHeight} from "react-icons/fa";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import React from "react";
import {Link} from '@gnothi/web/src/ui/Components/Link'

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
  body: <>The sky's the limit with <a target='_blank' href='FIXME'>BERT</a> language models! Astrology? Dream analysis? </>
}]

export default function Overviews() {
  return <>
    <Grid container spacing={4} sx={{px: {xs:1, md:2, lg:3}}}>
      {features.map((f, i) => <Grid
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
          }/>
          <CardContent sx={{minHeight: 100}}>
            <Typography>{f.body}</Typography>
          </CardContent>
          <CardActions>
            {f.k && <Link.Button
              to={`/about/${f.k}`}
              sx={{ml: 'auto'}}
              variant='outlined'
              color='primary'
            >Details</Link.Button>}
          </CardActions>
        </Card>
      </Grid>)}
    </Grid>
  </>
}
