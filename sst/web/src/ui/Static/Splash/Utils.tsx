import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const spacing = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 12
}
export const colors = {
  grey: "#FAFAFA",
  primaryMain: "#50577A",
  primaryLight: "#A7ABBC",
  black: "#000000",
  white: "#FFFFFF"
}
export const sx = {
  button1: {backgroundColor: "primary.main", color: colors.white, fontFamily: "Poppins"},
  button2: {backgroundColor: "primary.light", color: colors.black, fontFamily: "Poppins"},
  featureIcon: {fontSize: 40, color: "primary.main"}
}

type FeatureCard = {
  title?: string
  icon: React.ReactNode
  children: React.ReactNode
}
export function FeatureCard({title, icon, children}: FeatureCard) {
  return <Grid
    item
    xs={12}
    md={4}
  >
    <Card
      sx={{
        py: spacing.md,
        px: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: 5,
        elevation: 0
      }}
    >
      <CardContent>
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={spacing.sm}
        >
          {icon}
          {title && <Typography variant="h5">{title}</Typography>}
          <Typography
            variant="body1"
            sx={{textAlign: "center"}}
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
      px: spacing.lg,
      backgroundColor
  }}
  >
    {children}
  </Box>
}
