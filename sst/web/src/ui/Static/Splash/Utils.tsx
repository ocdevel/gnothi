import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {styles} from '../../Setup/Mui'

const {colors, spacing} = styles

type FeatureCard = {
  title?: string
  icon: React.ReactNode
  children: React.ReactNode
}
export function FeatureCard({title, icon, children}: FeatureCard) {
  return <Grid
    sx={{display: 'flex', flexGrow: 1}}
    item
    xs={12}
    md={6}
    lg={4}
  >
    <Card
      sx={{
        py: spacing.md,
        px: spacing.lg,
        backgroundColor: "transparent",
        borderRadius: 5,
        elevation: 0,
        boxShadow: 0,
      }}
    >
      <CardContent>
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={spacing.sm}
          maxWidth= {384}
        >
          {icon}
          {title && <Typography variant="h5">{title}</Typography>}
          <Typography
            variant="h6"
            sx={{flexShrink: 1, textAlign: "center"}}
          >{children}</Typography>
        </Stack>
      </CardContent>
    </Card>
  </Grid>
}

interface Section {
  color: 'dark' | 'light' | 'grey'
}
export function Section({children, color='light'}: React.PropsWithChildren<Section>) {
  const backgroundColor = {
    dark: "primary.main",
    light: "secondary.main",
    grey: "#fafafa"
  }[color]
  return <Box
    sx={{
      py: spacing.xl,
      px: spacing.xl,
      backgroundColor
  }}
  >
    {children}
  </Box>
}
