import { Box, Grid, Stack, Typography } from "@mui/material"

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