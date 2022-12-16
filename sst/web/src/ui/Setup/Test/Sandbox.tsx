import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import React, {useState, useEffect} from 'react'
import {
  Routes,
  Route,
  useLocation,
  useSearchParams,
  useNavigate,
  Outlet
} from "react-router-dom"
import Grid from '@mui/material/Grid'
import {useStore} from '@gnothi/web/src/data/store'
import Error from '@gnothi/web/src/ui/Components/Error'
import {Link} from '@gnothi/web/src/ui/Components/Link'
import Stack from "@mui/material/Stack";
import {BasicDialog, FullScreenDialog} from "../../Components/Dialog";
import {
  spacing,
  colors,
  sx
} from "../../Static/Splash/Utils"
import Button from "@mui/material/Button";
import {AuthComponent} from "../../Setup/Auth";
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Footer from '../../Footer'
import { typographyVariant } from '@mui/system';
import { RiAlignJustify } from 'react-icons/ri';



const pages = ['Dashboard', 'Sharing', 'Resources'];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  function renderButton(page: string) {
    return <Button
      key={page} 
      onClick={handleCloseNavMenu}
      sx={{mx:2, my: 2, fontFamily:'antic didone', fontSize:'1.2rem', color: 'primary.main', display: 'block' }}
    >
      {page}
    </Button>
  }

  return (
    <AppBar position="static" color='transparent'>
      <Container maxWidth={false}>
        <Toolbar disableGutters>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
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
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography fontFamily='antic didone' fontSize='1.2rem' textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
            <Link.Anchor to='/'>
            <img src="/Gnothi-LOGO-G10.png" height={40} />
            </Link.Anchor>
          </Box>   

         
          <Box sx={{ alignItems: 'center', flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Box sx={{marginRight: 5}}>
            <Link.Anchor to='/'>
              <img src="/Gnothi-LOGO-G10.png" height={40}/>
            </Link.Anchor>
            </Box>
            {pages.map(renderButton)}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
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
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;