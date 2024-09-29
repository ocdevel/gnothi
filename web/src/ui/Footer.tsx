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
import {FaDiscord as DiscordIcon} from "react-icons/fa"

import {
  MdOutlineMailOutline as EmailIcon,
  MdOutlineForum as ForumIcon,
  MdLockOutline as PrivacyIcon,
  MdBalance as TermsIcon,
  MdOutlineBackHand as DisclaimerIcon
} from "react-icons/md"
import {styles} from "./Setup/Mui.tsx";
import {DISCORD_LINK} from "../utils/config.ts";

interface FooterLink {
  icon?: React.FC
  to: string
  external?: boolean
  color: string
}

function FooterLink({icon, to, external, children, color}: React.PropsWithChildren<FooterLink>) {
  const muiProps = {
    style: {textDecoration: "none"},
    color,
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

interface Footer {
  inApp?: boolean
}

export default function Footer({inApp}: Footer) {
  const sx = inApp ? {
    wrapper: { backgroundColor: '#50577a' },
    container: { paddingTop: 5 },
    font: { color: "white" },
    icon: {
      fontSize: 20,
      color: "#ffffff"
    }
  } : {
    wrapper: { backgroundColor: '#fafafa' },
    container: {},
    font: { color: 'black' },
    icon: {
      fontSize: 20,
      color: "#50577a"
    }
  }
  return <Box sx={sx.wrapper}>
    <Grid
      container
      sx={{
        ...sx.container,
        flexDirection: 'row',
        alignItems: 'flex-start',   //align - vertical placement - top/bottom
        justifyItems: 'flex-start',
        marginTop: 10,
        px: {xs: 2, lg: 5},
        marginBottom: 3
      }}
    >
      <Grid item>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={sx.font}
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
          lg={2}
          justifyItems='flex-start'
          alignItems='flex-start'
          spacing={4}
          sx={{
            paddingTop: {xs: 3, md: 0},
          }}
        >
          <FooterLink
            color={sx.font.color}
            icon={<FaGithub {...sx.icon} />}
            external
            to="https://github.com/lefnire/gnothi"
          >Code on Github</FooterLink>
          <FooterLink
            color={sx.font.color}
            icon={<DiscordIcon {...sx.icon} />}
            to={DISCORD_LINK}
            external
          >Chat on Discord</FooterLink>
          <FooterLink
            color={sx.font.color}
            icon={<EmailIcon {...sx.icon} />}
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
              color={sx.font.color}
              icon={<PrivacyIcon {...sx.icon} />}
              to='/privacy'>Privacy Policy</FooterLink>
          </Box>
          <Box marginBottom='.5rem'>
            <FooterLink
              color={sx.font.color}
              icon={<TermsIcon {...sx.icon} />}
              to='/terms'>Terms & Conditions</FooterLink>
          </Box>
          <Box marginBottom='.5rem'>
            <FooterLink
              color={sx.font.color}
              icon={<DisclaimerIcon {...sx.icon} />}
              to='/disclaimer'>Disclaimer</FooterLink>
          </Box>
        </Grid>
      </Grid>
    </Grid>

    {!inApp && <Box>
      <Divider
        color='#50577a'
        sx={{
          borderBottomWidth: 2,
          borderColor: '#50577a',
          opacity: .5,
          marginBottom: 2,
          marginTop: 2,
          mx: {xs: 2, lg: 5}
        }}
      >
      </Divider>
    </Box>}


    <Box
      sx={{
        mx: {xs: 2, lg: 5},
        paddingBottom: 2,
        display: 'flex',
        alignItems: {xs: 'center', md: "flex-end"},
        justifyContent: {xs: 'center', md: "flex-end"}
      }}
    >
      <Typography
        variant='body2'
        sx={{
          ...sx.font,
          display: 'flex',
          fontWeight: 400
        }}
      >
        Copyright © 2019-2023 OCDevel, LLC
      </Typography>
    </Box>
  </Box>
}