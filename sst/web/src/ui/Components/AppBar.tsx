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


const buttonSx = {
  fontWeight: 300,
  fontFamily: 'poppins',
  fontSize: '1rem',
  color: "primary.main",
}


interface ResponsiveAppBar {
  title?: string
  links?: {name: string, to: string}[]
  cta?: {name: string, fn: () => void}
  userMenu?: boolean
  onClose?: () => void
}
function ResponsiveAppBar({title, links, cta, userMenu, onClose}: ResponsiveAppBar) {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const logoLeft = title || links?.length

    const logo =  <Box
      sx={{height: 40, mb: {md: .6}}}
    >
    <Link.Anchor to="/">
      <img src="/Gnothi-LOGO-G10.png" height="100%" />
    </Link.Anchor>
  </Box>

  function renderLink({name, to}: {name: string, to: string}) {
    return <Button
      key={to}
      onClick={handleCloseNavMenu}
      sx={{...buttonSx, mx: 2, my: 2, display: 'block'}}
    >
      {name}
    </Button>
  }

  function renderRight() {
    if (cta) {
      return <Button
        variant="contained"
        onClick={cta.fn}
      >
        {cta.name}
      </Button>
    }
    if (userMenu) {
      const settings = ['Profile', 'Account', 'Settings', 'Logout']
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
          {settings.map((setting) => (
            <MenuItem
              sx={{...buttonSx}}
              key={setting}
              onClick={handleCloseUserMenu}>
              <Typography sx={{...buttonSx, textAlign:"center"}}>{setting}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    }
    return null
  }

  function renderLeft() {
    if (onClose) {
      return <Stack spacing={1} direction="row" alignItems="center">
        <IconButton
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" color="primary">{title}</Typography>
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
          {links?.map(({name, to}) => (
            <MenuItem key={to} onClick={handleCloseNavMenu}>
              <Typography sx={{...buttonSx, textAlign: "center"}}>{name}</Typography>
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
    return  <Box
      sx={{
        alignItems: 'center',
        flexGrow: 1,
        display: { xs: 'none', md: 'flex' }
      }}
    >
      {!onClose && logo}
      {links?.map(renderLink)}
    </Box>
  }



  return (
    <AppBar position="static" color='transparent'>
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          {renderLeft()}
          {renderMiddle()}
          {renderRight()}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;


