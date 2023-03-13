import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { styles } from '../../../Setup/Mui'
import { Container } from "@mui/material";
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';

const { colors, spacing } = styles



type FeatureCardSm = {
  icon: React.ReactNode
  title: string
  color: string
}

export function FeatureCardSm({icon, title, color}: FeatureCardSm) {
  return <Card 
    sx={{
      minWidth: 275,
      elevation: 12,
      borderRadius: 5,
      backgroundColor: "#ffffff",
      alignItems:"center",
      justifyContent:"center"
    }}
    >
      
    <CardContent
      color={color}
      >
      {icon}
    </CardContent>

    <CardContent>
      <Typography
        color={color}
        >
      {title}
      </Typography>
    </CardContent>  
  </Card>
}

type FeatureCard = {
  title?: string
  icon: React.ReactNode
  children?: React.ReactNode
}
export function FeatureCard({ title, icon, children }: FeatureCard) {
  return <Grid
    sx={{flexGrow: 1 }}
    item
    xs={1}
    
  >
    <Card
      sx={{
        py: spacing.sm,
        px: spacing.sm,
        backgroundColor: "#ffffff",
        borderRadius: 5,
        elevation: 10,
        boxShadow: 0,
      }}
    >
      <CardContent>
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={spacing.sm}
          maxWidth={50}
        >
          {icon}
          {title && <Typography variant="h6">{title}</Typography>}
          <Typography
            variant="h6"
            sx={{ textAlign: "center" }}
          >{children}</Typography>
        </Stack>
      </CardContent>
    </Card>
  </Grid>
}

interface Section {
  color: 'dark' | 'light' | 'grey'
}
export function Section({ children, color = 'light' }: React.PropsWithChildren<Section>) {
  const backgroundColor = {
    dark: "primary.main",
    light: "secondary.main",
    grey: "#fafafa"
  }[color]
  
  return <Box
    sx={{
      // py: spacing.xl,
      // px: spacing.xl,
      backgroundColor
    }}
  >
    <Stack
      direction="column" 
      spacing={4} 
      alignItems="center"
      sx={{
        mt: 10,
        mb: 15,
        mx: {xs: 2, sm: 5, md: 8, lg: 12}
      }}
    >
      {children}
    </Stack>
  </Box>
}

export function Skeleton2() {
  return <Box
    borderRadius={10}
    sx={{ 
      alignItems: "center",
      width:'100%',
      height:'300px',
      backgroundColor: '#AFB3C2'
    }}
  ></Box>
}

export function Skeleton3() {
  return <Box
    borderRadius={10}
    sx={{ 
      alignItems: "center",
      width:'100%',
      height:'300px',
      backgroundColor: '#f1f1f4' 
    }}
  ></Box>
}

export function Skeleton4() {
  return <Box
    borderRadius={10}
    sx={{ 
      alignItems: "center",
      width:'300px',
      height:'250px',
      backgroundColor: '#f1f1f4' 
    }}
  ></Box>
}

export function Skeleton5() {
  return <Box
    borderRadius={10}
    sx={{ 
      alignItems: "center",
      width:'100%',
      height:'300px',
      backgroundColor: '#f1f1f4' 
    }}
  ></Box>
}
