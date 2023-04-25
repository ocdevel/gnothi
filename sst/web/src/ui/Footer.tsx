import { Link } from "react-router-dom";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from '@mui/material/Container';
import { Static } from "./Static/Routes";
import { padding } from "@mui/system";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

function Footer1() {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <Container maxWidth={false}>
    <Box sx={{ alignItems: 'center', justifyContent: 'space-around', position: 'static', my: 3, mx: 3, flexGrow: 1, display: "flex" }}>
      <Typography
        component='footer'
        variant='body2'
      >
        <Box sx={{ display: 'flex', my: 2, flexGrow: 1 }}>
          <Box>
            <Link to='/about'>About</Link>{' '}&#183;{' '}
            <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
            <Link to='/privacy'>Privacy</Link>{' '}&#183;{' '}
            <Link to='/terms'>Terms</Link>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box>© 2020 OCDevel, LLC</Box>
        </Box>

      </Typography>
    </Box>
  </Container>

}

export default function Footer2() {
  return <Box
    sx={{
      backgroundColor: '#fafafa',
    }}
  >
    <Grid container
      sx={{
        flexDirection: 'row',
        alignItems: 'flex-start',   //align - vertical placement - top/bottom
        justifyItems: 'flex-start',
        marginTop: 10,
        paddingX: {xs: 4, sm: 7, md: 10, lg: 14},
        marginBottom: 3
      }}
    >
      <Grid item
        xs={12}
        md={3}
        justifyContent='flex-start'
        alignContent='flex-start'
        spacing={4}
      >
        <Typography
          variant="h6"
          color='#50627A'
          marginBottom='1rem'
        >
          Company
        </Typography>

        <Typography
          marginBottom='.5rem'
        >
          About
        </Typography>

        <Typography
          marginBottom='.5rem'
        >
          Features
        </Typography>

        <Typography
          marginBottom='.5rem'
        >
          Contact Us
        </Typography>
      </Grid>

      <Grid item
        xs={12}
        md={3}
        justifyItems='flex-start'
        alignItems='flex-start'
        spacing={4}
        sx={{
          paddingTop: { xs: 3, md: 0 },
        }}
      >
        <Typography
          variant="h6"
          color='#50627A'
          marginBottom='1rem'
        >
          Community
        </Typography>

        <Typography
          marginBottom='.5rem'
        >
          Github
        </Typography>

        <Typography
          marginBottom='.5rem'
        >
          Reddit
        </Typography>
        <Typography
          marginBottom='.5rem'
        >
          LinkedIn
        </Typography>
      </Grid>

      <Grid item
        direction="row"
        xs={12}
        md={3}
        justifyItems='flex-start'
        alignItems='flex-start'
        spacing={4}
        sx={{
          paddingTop: { xs: 3, md: 0 }
        }}
      >
        <Typography
          variant="h6"
          color='#50627A'
          marginBottom='1rem'
        >
          Legal
        </Typography>

        <Box
          marginBottom='.5rem'>
       <Link to='/privacy'>Privacy Policy</Link>
          </Box>
          <Box
             marginBottom='.5rem'>
       <Link to='/terms'>Terms and Conditions</Link>
          </Box>
        <Box
             marginBottom='.5rem'>
       <Link to='/disclaimer'>Disclaimer</Link>
          </Box>
      </Grid>
    </Grid>

    <Box
      sx={{
        marginX: { xs: 2, sm: 5, md: 8, lg: 12 },
        marginBottom: 3,
      }}
    >
      <Divider
        variant='middle'
        sx={{ color: "green" }}
      >
      </Divider>
    </Box>

    <Box
      sx={{
        marginX: { xs: 4, sm: 7, md: 10, lg: 14 },
        marginBottom: 4,
        display: 'flex',
        alignItems: { xs: 'center', md: "flex-end" },
        justifyContent: { xs: 'center', md: "flex-end" }
      }}
    >
      <Typography
        variant='body1'
        sx={{
          display: 'flex',
        }}
      >
        Copyright © 2020 OCDevel, LLC
      </Typography>
    </Box>

  </Box>

}


