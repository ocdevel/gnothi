import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import React, {useState, useEffect} from 'react'
import {Link} from '@gnothi/web/src/ui/Components/Link'

import Button from "@mui/material/Button";
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import CloseIcon from "@mui/icons-material/Close";
import Stack from "@mui/material/Stack";

import {styles} from '../Setup/Mui'
import {useStore} from "../../data/store";
import {useNavigate} from "react-router-dom";
import ProfileIcon from '@mui/icons-material/Person';
import BackIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import CircularProgress from "@mui/material/CircularProgress";
import {shallow} from "zustand/shallow";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import {STAGE} from '../../utils/config'
import dayjs from "dayjs";
import {CREDIT_MINUTES} from '../../../../schemas/users'
import Chip from "@mui/material/Chip";
import {Stack2} from "./Misc.tsx";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

const buttonSx = {
  fontWeight: 300,
  fontFamily: 'poppins',
  fontSize: '1rem',
  color: "primary.main",
}

export function UserMenu() {
  const [user, setPremiumModal] = useStore(s => [
    s.user?.viewer,
    s.modals.setPremium
  ], shallow)
  const logout = useStore(s => s.logout)
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const items = [
    // {name: 'Profile', onClick: () => {
    //   handleCloseUserMenu()
    // }},
    {
      name: 'Premium',
      className: "btn-premium",
      onClick: () => {
        handleCloseUserMenu()
        setPremiumModal(true)
      }
    },
    // {name: 'Settings', onClick: () => {
    //   handleCloseUserMenu()
    // }},
    {
      name: 'Logout',
      className: "btn-logout",
      onClick: () => {
        handleCloseUserMenu()
        logout()
      }
    },
  ]
  return <Box sx={{ flexGrow: 0}} className="usermenu">
    <Tooltip title="Open settings">
      <IconButton
        className="btn-profile"
        onClick={handleOpenUserMenu}
        sx={{ ...buttonSx, p: 0 }}>
        <Avatar alt={user?.email}>
          {user?.id ? <ProfileIcon /> : <CircularProgress />}
        </Avatar>
      </IconButton>
    </Tooltip>
    <Menu
      sx={{ mt: '45px' }}
      id="menu-appbar"
      anchorEl={anchorElUser}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorElUser)}
      onClose={handleCloseUserMenu}
    >
      {items.map((item) => (
        <MenuItem
          classes={{root: item.className}}
          className={item.className}
          sx={{...buttonSx}}
          key={item.name}
          onClick={item.onClick}
        >
          <Typography sx={{...buttonSx, textAlign:"center"}}>{item.name}</Typography>
        </MenuItem>
      ))}
    </Menu>
  </Box>
}

type Clickable = {
  name: string
  to?: string
  onClick?: () => void
  className?: string
}
export type Link = Clickable
export type CTA = Clickable & {
  secondary?: boolean
}

interface ResponsiveAppBar {
  clearBottom?: boolean
  title?: string
  links?: Link[]
  ctas?: CTA[]
  onClose?: () => void
  backButton?: boolean
}
export default function ResponsiveAppBar({
  title,
  links,
  ctas,
  onClose,
  clearBottom,
  backButton,
}: ResponsiveAppBar) {
  const navigate = useNavigate()
  const authenticated = useStore(s => s.authenticated)

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget)
  const handleCloseNavMenu = () => setAnchorElNav(null)

  const isModal = !!onClose
  const isSplash = !authenticated && !isModal
  const isApp = !isSplash && !isModal

  const onClick = (item: Clickable) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (item.onClick) { item.onClick() }
    if (item.to) { navigate(item.to) }
    handleCloseNavMenu()
  }

  const logo = <Box
      sx={{height: 30, mb: {md: .6}}}
    >
    <Link.Anchor to="/">
      <img src="/Gnothi_ShortnoLamp.svg" height="100%" />
    </Link.Anchor>
  </Box>

  function renderLeft() {
    if (isModal) {
      return <Stack spacing={1} direction="row" alignItems="center">
        <IconButton
          onClick={onClose}
          aria-label="close"
          className='btn-dialog-close'
        >
          {backButton ? <BackIcon /> : <CloseIcon />}
        </IconButton>
      </Stack>
    }
    if (links?.length) {
      return  <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, alignItems: "center" }}>
        <IconButton
          size="small"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleOpenNavMenu}
          color='primary'
        >
          {/*<MenuIcon />*/}
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{
            display: { xs: 'block', md: 'none' },
          }}
        >
          {links?.map((link) => (
            <MenuItem
              key={link.name}
              onClick={onClick(link)}
              className={link.className}
            >
              <Typography sx={{...buttonSx, textAlign: "center"}}>{link.name}</Typography>
            </MenuItem>
          ))}
        </Menu>
        {logo}
      </Box>
    }

    return <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, alignItems: "center" }}>
      {logo}
    </Box>
  }

  function renderMiddle() {
    return  <Stack spacing={2} direction="row"
      sx={{
        alignItems: 'center',
        flexGrow: 1,
        display: { xs: 'none', md: 'flex' }
      }}
    >
      {isModal ? <>
        <Typography variant="h6"  color="primary">{title}</Typography>
      </> : <>
        {logo}
        {links?.map(link => <Button
          className={link.className}
          key={link.name}
          onClick={onClick(link)}
          sx={{...buttonSx, display: 'block'}}
        >
          {link.name}
        </Button>)}
      </>}
    </Stack>
  }

  function renderRight() {
    return <Stack spacing={{xs: 1, sm: 2}} direction="row" alignItems="center">
      {ctas?.map((cta, i) => (
        <Button
          className={`cta-${cta.secondary ? 'secondary' : 'primary'}`}
          key={cta.name}
          variant="contained"
          size="small"
          onClick={onClick(cta)}
          sx={cta.secondary ? styles.sx.button2 : styles.sx.button1}
        >
          {cta.name}
        </Button>
      ))}
      {isApp && <UserMenu />}
    </Stack>
  }

  return <>
    <AppBar
      position="static"
      color='transparent'
      className='appbar'
      sx= {clearBottom ? {mb: 3} : {}}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          {renderLeft()}
          {renderMiddle()}
          {renderRight()}
        </Toolbar>
      </Container>
      <CreditBanner />
    </AppBar>
  </>
}

function CreditBanner() {
  const [
    creditActive,
    creditSeconds,
    me,
    setPremium
  ] = useStore(s => [
    s.creditActive,
    s.creditSeconds,
    s.user?.me,
    s.modals.setPremium
  ], shallow)
  if (!creditActive) { return null }
  if (!me) { return null }
  const timeLeft = CREDIT_MINUTES * 60 - creditSeconds
  return <>
    <Alert
      icon={false}
      severity="info"
      action={
        <Button color="inherit" size="small" onClick={() => setPremium(true)}>
          Upgrade for unlimited
        </Button>
      }
      // sx={{display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "column"}}
    >
      <AlertTitle>{me?.credits} / 10 credits</AlertTitle>
      <Stack2 direction='row'>
        <Typography>Credit active:</Typography>
        <Chip variant="outlined" label={formatSecondsToMinutes(timeLeft)} />
      </Stack2>
    </Alert>
  </>
}

function formatSecondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}