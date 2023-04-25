import React, {useEffect} from 'react'
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import { Section } from './Splash/Home/Utils';
import {styles} from "../Setup/Mui";
const {spacing, colors, sx} = styles
import Stack from '@mui/material/Stack';

export default function Disclaimer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  return <Stack>
    <Section color="dark">
      <Stack
        sx={{
          display: "flex",
          direction: "column",
          alignItems: "flex-start",
          justifyItems: "center",
        }}>
        <Typography
          variant="h1"
          maxWidth={800}
          sx={{
            textAlign: "left",
            color: colors.white,
            mt: { xs: 4, sm: 10 },
            mb: 4
            }}>
          Disclaimer
        </Typography>
        <Typography
          variant="body1"
          maxWidth={800}
          sx={{
            textAlign: "left",
            color: colors.white,
            mb: 4
            }}>
          This site is not meant to serve as a substitute for professional medical advice, diagnosis, or treatment, and does not replace it.

        </Typography>
        <Typography
          variant="body1"
          maxWidth={800}
          sx={{
            textAlign: "left",
            color: colors.white,
            mb: 4
            }}>
          Immediately call a healthcare professional and/or 911 if you are experiencing a medical or mental health emergency, are considering suicide, or are taking actions that may cause harm to you or to others.
        </Typography>
        <Typography
          variant="body1"
          maxWidth={800}
          sx={{
            textAlign: "left",
            color: colors.white,
            mb: 2
            }}>
          The services are used solely at your own risk. Advice related to the practice of medicine, dentistry, nursing, pharmacy, or other type of professional healthcare is not intended to be, and should not be interpreted as the provision of medical care. Health advice can only be given by licensed healthcare professionals. You alone are responsible to seek treatment.
        </Typography>
      </Stack>
      </Section>
      <Section color="grey">
        <Stack>
        </Stack>
        </Section>
  </Stack>
}
