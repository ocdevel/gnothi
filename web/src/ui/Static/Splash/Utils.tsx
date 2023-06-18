import { Box, Grid, Stack, Typography } from "@mui/material"

type FeatureIntro2 = {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  color: string
}



export function FeatureIntro2({
  icon,
  title,
  children,
  color
}: FeatureIntro2) {
  return <Grid
    container
    xs={12}
    md={3}
    alignItems="center"
    justifyContent="center"
    spacing={2}
    direction='column'
    mb={3}
  >
      <Grid item
        alignContent="center"
      >
        {icon}
      </Grid>
      <Grid item
        alignContent="center"
      >
        <Typography
          variant='h6'
          textAlign="center"
          color={color}
          marginBottom={1}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          maxWidth={400}

        >
          {children}
        </Typography>
        </Grid>
  </Grid>


                              }

type FeatureIntro = {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  color: string
}

export function FeatureIntro({
  icon,
  title,
  children,
  color
}: FeatureIntro){
  return <Grid item xs={12} md={6}>
    <Stack
      px={4}
      direction="row"
      alignItems="flex-start"
      justifyContent="center"
      spacing={2}
    >
      {icon}
      <Box maxWidth={450}>
        <Typography
          variant='h6'
          color={color}
          marginBottom={1}
        >
          {title}
        </Typography>

        <Typography
        variant="body1"
        >{children}</Typography>
      </Box>
    </Stack>
  </Grid>
}
