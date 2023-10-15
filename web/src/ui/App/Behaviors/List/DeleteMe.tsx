// Saving this here until I launch habit-tracking, to double check what we need to keep from the old
// stuff. Delete this when we're launched
import _ from "lodash";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TipsIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import StarIcon from "@mui/icons-material/StarBorder";
import DoneIcon from "@mui/icons-material/Done";
import NumbersIcon from "@mui/icons-material/NumbersOutlined";
import {DISCORD_LINK} from "../../../../utils/config.ts";
import React from "react";

export function DeleteMe() {
  const groups: FieldGroup[] = [{
    service: 'custom',
    name: 'Custom',
    fields: _.chain(fields?.rows)
      .filter(v => !v.service && !v.excluded_at)
      .sortBy('id').value(),
    emptyText: () => <Box>
      <Typography color="primary" textAlign="center" fontWeight={500} mb={1}>Welcome to the Behaviors
        feature!</Typography>
      <Typography textAlign="center" mb={1}>It’s here to help you track the activity or quality of the various behaviors
        in your life—like mood, sleep, substance, habits, etc. </Typography>
    </Box>

  }, {
    service: "about",
    name: "Getting Started",
    fields: [],
    emptyText: () => <Box>
      <Stack marginLeft={2}>
        <Typography mb={3} variant={"body1"}>Simply click <i>Add Behaviors</i> to fill out the form. Save, repeat for
          other behaviors, and start tracking.</Typography>
        <Typography color="#0077C2" variant={"body1"} fontWeight={500}><TipsIcon
          sx={{color: "#0077C2", fontSize: 18, marginRight: 1}}/>Pro Tip</Typography>
        <Typography variant="body2" mb={2}>Sync your Habitica account to Gnothi for advanced habit tracking and AI
          insights. See the <i>Habitica</i> drop-down for more info.</Typography>
        <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>Behavior Tracking Ideas</Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><StarIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Five-Star Rating for Quality</Typography>
        <Typography variant="body2" mb={2}> Intended for measuring the quality of your experiences in a day, such as
          sleep, mood, energy, and productivity.</Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><DoneIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Check for "Yes/No" Behaviors</Typography>
        <Typography variant="body2" mb={2}>Ideal for tracking daily tasks. <i>Did I meditate, take medication, exercise,
          journal, read, etc?</i></Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><NumbersIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Numbers for Quantity</Typography>
        <Typography variant="body2" mb={2}>Some ideas include hours slept, number of walks, alcohol/substance intake,
          chapters read, and number of glasses of water.</Typography>

      </Stack>
    </Box>
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _.chain(fields?.rows)
      .filter(v => v.service === 'habitica' && !v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <Box>
      <Typography mb={3}>Combine the robust functionality of Habitica with Gnothi's AI-driven tools to gain deeper
        self-understanding.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>What is Habitica?</Typography>
      <Typography variant="body2" mb={2}>Created by one of the creators of Gnothi, Habitica is a gamified habit tracking
        platform that empowers users to track behaviors, to-dos, and habits with its comprehensive
        functionality.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>Why create a Habitica account to sync to
        Gnothi?</Typography>
      <Typography variant="body2" mb={2}>While Gnothi allows you to add and track custom behaviors directly, power-users
        will appreciate the rich features offered by Habitica for habit-tracking and daily to-dos
        specifically.</Typography>
      <Typography variant="body2" mb={2}>To get the best of both worlds, use Gnothi for qualitative data (mood,
        sleep-quality, decisions) and Habitica for habits and to-dos. Then supercharge your experience with AI insights
        from Gnothi.</Typography>
      <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>Syncing Habitica to Gnothi:</Typography>
      <Typography mb={1} variant={"body2"}>1. Sign up for <a href='https://habitica.com/' target='_blank'>Habitica</a>
        <i>(free)</i></Typography>
      <Typography mb={1} variant={"body2"}>2. Go to settings in your Habitica account</Typography>
      <Typography mb={1} variant={"body2"}>3. Select the "API" tab</Typography>
      <Typography mb={1} mb={3} variant={"body2"}>4. Enter your User ID and API token <i>(below)</i></Typography>
      <Typography color="#0077C2" variant={"body1"} fontWeight={500}>Have questions?</Typography>
      <Typography mb={3} color="#0077C2" fontWeight={500} variant={"body2"}>Feel free to send an <a
        href="mailto:gnothi@gnothiai.com">email</a> or reach out on <a href={DISCORD_LINK}
                                                                       target="_blank">Discord</a> to
        connect.</Typography>
      <Typography mb={3}>Your User ID and API Token are database-encrypted. <em>All</em> sensitive data in Gnothi is
        encrypted.</Typography>
    </Box>

  }, {
    service: 'excluded',
    name: 'Excluded from AI',
    fields: _.chain(fields?.rows)
      .filter(v => !!v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <Box>
      <Typography mb={3}>Customize your AI insights on Gnothi by excluding specific behaviors.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>What does it mean to <i>exclude</i> a
        behavior?</Typography>
      <Typography variant="body2" mb={2}>If you stop tracking a behavior but want to keep it for reference, you can
        click "Exclude" to prevent it from appearing in your active tracking.</Typography>
      <Typography variant="body2" mb={2}>For instance, if you have synced your Habitica account and imported a daily
        "to-do," excluding it on Gnothi ensures that you won't receive AI insights and charts specifically related to
        your progress with that behavior.</Typography>
      <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>How to exclude a behavior:</Typography>
      <Typography mb={1} variant={"body2"}>1. Click on the behavior you want to exclude</Typography>
      <Typography mb={1} variant={"body2"}>2. Select the <i>Advanced</i> drop-down in the <i>Edit
        Behavior</i> form</Typography>
      <Typography mb={1} variant={"body2"}>3. Click on the <i>Exclude</i> button</Typography>
      <Typography mb={3} variant={"body2"}>Note: If you decide to track the behavior again, it will be here in the
        "Excluded" drop-down.</Typography>
      <Typography color="#0077C2" variant={"body1"} fontWeight={500}>Have questions?</Typography>
      <Typography mb={3} color="#0077C2" fontWeight={500} variant={"body2"}>Feel free to send an <a
        href="mailto:gnothi@gnothiai.com">email</a> or reach out on <a href={DISCORD_LINK}
                                                                       target="_blank">Discord</a> to
        connect.</Typography>
    </Box>
  },
    // {
    //   service: 'advanced',
    //   name: 'Advanced',
    //   fields: [],
    //   emptyText: () => <Advanced fetchFieldEntries={fetchFieldEntries} />
    // }
  ]
}