import {Link as RouterLink} from "react-router-dom";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from '@mui/material/Container';
import {Static} from "./Static/Routes";
import {padding} from "@mui/system";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
// import CodeIcon from '@mui/icons-material/CodeOutlined';
// import KeyboardIcon from '@mui/icons-material/KeyboardOutlined';
// import EmailIcon from '@mui/icons-material/EmailOutlined';
// import ForumIcon from '@mui/icons-material/ForumOutlined';
import {FaGithub} from "react-icons/fa"
import MUILink from '@mui/material/Link';

import {MdOutlineMailOutline as EmailIcon, MdOutlineForum as ForumIcon, MdLockOutline as PrivacyIcon, MdBalance as TermsIcon, MdOutlineBackHand as DisclaimerIcon} from "react-icons/md"
import {styles} from "./Setup/Mui.tsx";

interface FooterLink {
  icon?: React.FC
  to: string
  external?: boolean
}

function FooterLink({icon, to, external, children}: React.PropsWithChildren<FooterLink>) {
  const muiProps = {
    style: {textDecoration: "none"},
    color: "black",
    underline: 'hover',
    ...(external ? {target: "_blank", href: to} : {})
  }
  const routerProps = {
    style: muiProps.style,
    to,
  }
  const muiLink = <MUILink {...muiProps}>{children}</MUILink>
  return <Stack direction='row' marginBottom={'.5rem'} alignItems="center" spacing={1}>
    {icon}
    {external ? muiLink : <RouterLink {...routerProps}>{muiLink}</RouterLink>}
  </Stack>
}

export default function Footer2() {


  return <Box
    sx={{
      backgroundColor: '#fafafa',
    }}
  >
    <Grid
      container
      sx={{
        flexDirection: 'row',
        alignItems: 'flex-start',   //align - vertical placement - top/bottom
        justifyItems: 'flex-start',
        marginTop: 10,
        paddingX: {xs: 4, sm: 7, md: 10, lg: 14},
        marginBottom: 3
      }}
    >
      <Grid item>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          color='#50627A'
          marginBottom='1rem'
        >
          Have questions or comments? Reach out to us!
        </Typography>
      </Grid>

      <Grid
        item
        container
        flexDirection='row'>

        <Grid
          item
          xs={12}
          md={4}
          lag={2}
          justifyItems='flex-start'
          alignItems='flex-start'
          spacing={4}
          sx={{
            paddingTop: {xs: 3, md: 0},
          }}
        >
          <FooterLink
            icon={<FaGithub {...styles.sx.footerIcon} />}
            external
            to="https://github.com/lefnire/gnothi"
          >Code on Github</FooterLink>
          <FooterLink
            icon={<ForumIcon {...styles.sx.footerIcon} />}
            to="https://www.reddit.com/r/gnothi"
            external
          >Discuss on Reddit</FooterLink>
          <FooterLink
            icon={<EmailIcon {...styles.sx.footerIcon} />}
            to="mailto:Gnothi@gnothiai.com"
            external
          >Message via Email</FooterLink>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          lg={2}
          justifyItems='flex-start'
          alignItems='flex-start'
          spacing={2}
          sx={{
            paddingTop: {xs: 3, md: 0},
          }}
        >
          <Box marginBottom='.5rem'>
            <FooterLink
              icon={<PrivacyIcon {...styles.sx.footerIcon} />}
              to='/privacy'>Privacy Policy</FooterLink>
          </Box>
          <Box marginBottom='.5rem'>
            <FooterLink
              icon={<TermsIcon {...styles.sx.footerIcon} />}
              to='/terms' >Terms & Conditions</FooterLink>
          </Box>
          <Box marginBottom='.5rem'>
            <FooterLink
              icon={<DisclaimerIcon {...styles.sx.footerIcon} />}
              to='/disclaimer'>Disclaimer</FooterLink>
          </Box>
        </Grid>
      </Grid>
    </Grid>

       <Box
      sx={{
        marginX: {xs: 2, sm: 5, md: 8, lg: 12},
        marginBottom: 3,
      }}
    >
      <Divider
        color='#50577a' variant="middle" sx={{borderBottomWidth: 2}}
      >
      </Divider>
    </Box>

    <Box
      sx={{
        marginX: {xs: 4, sm: 7, md: 10, lg: 14},
        marginBottom: 4,
        display: 'flex',
        alignItems: {xs: 'center', md: "flex-end"},
        justifyContent: {xs: 'center', md: "flex-end"}
      }}
    >
      <Typography
        variant='body2'
        sx={{
          display: 'flex', fontWeight: 400
        }}
      >
        Copyright © 2020 OCDevel, LLC
      </Typography>
    </Box>

  </Box>

}


    function FooterOld() {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <Container maxWidth={false}>
    <Box sx={{
      alignItems: 'center',
      justifyContent: 'space-around',
      position: 'static',
      my: 3,
      mx: 3,
      flexGrow: 1,
      display: "flex"
    }}>
      <Typography
        component='footer'
        variant='body2'
      >
        <Box sx={{display: 'flex', my: 2, flexGrow: 1}}>
          <Box>
            <Link to='/about'>About</Link>{' '}&#183;{' '}
            <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
            <Link to='/privacy'>Privacy</Link>{' '}&#183;{' '}
            <Link to='/terms'>Terms</Link>
          </Box>
        </Box>

        <Box sx={{display: 'flex', justifyContent: 'center'}}>
          <Box>© 2020 OCDevel, LLC</Box>
        </Box>

      </Typography>
    </Box>
  </Container>

}






