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


const buttonSx = {
  fontWeight: 300,
  fontFamily: 'poppins',
  fontSize: '1rem',
  color: "primary.main",
}

export function UserMenu() {
  const logout = useStore(s => s.logout)
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const items = [
    {name: 'Profile', onClick: () => {
      handleCloseUserMenu()
    }},
    {name: 'Account', onClick: () => {
      handleCloseUserMenu()
    }},
    {name: 'Settings', onClick: () => {
      handleCloseUserMenu()
    }},
    {name: 'Logout', onClick: () => {
      handleCloseUserMenu()
      logout()
    }},
  ]
  return <Box sx={{ flexGrow: 0 }}>
    <Tooltip title="Open settings">
      <IconButton
        onClick={handleOpenUserMenu}
        sx={{ ...buttonSx, p: 0 }}>
        <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
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
type Link = Clickable
export type CTA = Clickable & {
  secondary?: boolean
}

interface ResponsiveAppBar {
  clearBottom?: boolean
  title?: string
  links?: Link[]
  ctas?: CTA[]
  onClose?: () => void
}
export default function ResponsiveAppBar({
  title,
  links,
  ctas,
  onClose,
  clearBottom
}: ResponsiveAppBar) {
  const navigate = useNavigate()
  const jwt = useStore(s => s.jwt)

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget)
  const handleCloseNavMenu = () => setAnchorElNav(null)

  const isModal = !!onClose
  const isSplash = !jwt && !isModal
  const isApp = !isSplash && !isModal

  const onClick = (item: Clickable) => (e: React.SyntheticEvent<HTMLElement>) => {
    if (item.onClick) { item.onClick() }
    if (item.to) { navigate(item.to) }
    handleCloseNavMenu()
  }

  const logo = <Box
      sx={{height: 40, mb: {md: .6}}}
    >
    <Link.Anchor to="/">
      <img src="/Gnothi-LOGO-G10.png" height="100%" />
    </Link.Anchor>
  </Box>

  function renderLeft() {
    if (isModal) {
      return <Stack spacing={1} direction="row" alignItems="center">
        <IconButton
          onClick={onClose}
          aria-label="close"
          className='button-dialog-close'
        >
          <CloseIcon />
        </IconButton>
      </Stack>
    }
    if (links?.length) {
      return  <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, alignItems: "center" }}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleOpenNavMenu}
          color='primary'
        >
          <MenuIcon />
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
        <Typography variant="h6" color="primary">{title}</Typography>
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
    return <Stack spacing={2} direction="row" alignItems="center">
      {ctas?.map((cta, i) => (
        <Button
          className={`cta-${cta.secondary ? 'secondary' : 'primary'}`}
          key={cta.name}
          variant="contained"
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
      sx={clearBottom ? {mb: 3} : {}}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          {renderLeft()}
          {renderMiddle()}
          {renderRight()}
        </Toolbar>
      </Container>
    </AppBar>
  </>
}


