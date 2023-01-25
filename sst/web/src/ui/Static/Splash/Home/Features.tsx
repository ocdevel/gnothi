import React, {useState, useEffect} from "react"
import Grid from "@mui/material/Grid";

const {spacing, colors, sx} = styles
import {Section} from './Utils'
import Typography from "@mui/material/Typography";
import {styles} from "../../../Setup/Mui";

export default function Features() {
  return <Grid>
    <Section color="dark">
      <Typography variant="h2">Explore the features</Typography>
    </Section>
    <Section>
      Feature cards
    </Section>    
  </Grid>
}
