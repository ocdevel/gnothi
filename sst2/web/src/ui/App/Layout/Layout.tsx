import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import {useMediaQuery} from "react-responsive";

import Sections from './Sections'
import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {S} from '@gnothi/web/src/ui/Components/Routing'

const EntriesToolbar = React.lazy(() => import("../Entries/Toolbar"))
const GroupsToolbar = React.lazy(() => import ("../Groups/List/Toolbar"))
const InsightsToolbar = React.lazy(() => import ("../Insights/Toolbar"))
const ResourcesToolbar = React.lazy(() => import ("../Resources/Toolbar"))
const GroupToolbar = React.lazy(() => import ("../Groups/View/Toolbar"))

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

function PersistentDrawerLeft({children}: React.PropsWithChildren) {
  const theme = useTheme();
  const location = useLocation()
  const isDesktop = useMediaQuery({ minWidth: 960 })
  const [open, setOpen] = React.useState(isDesktop);

  const handleDrawerOpen = () => setOpen(true);

  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: 'flex' }}>
      {/*<CssBaseline />*/}
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Toolbars />
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" component="div">
            Gnothi
          </Typography>
          <Divider />
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />
        <Sections />
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
        <Outlet />
      </Main>
    </Box>
  );
}

function Toolbars() {
  return <>
    <Routes>
      <Route path='/j/*' element={<S><EntriesToolbar /></S>} />
      <Route path='/groups/*' element={<S><GroupsToolbar /></S>} />
      <Route path='/groups/:gid' element={<S><GroupToolbar /></S>} />
      <Route path='/insights/*' element={<S><InsightsToolbar /></S>} />
      <Route path='/resources/*' element={<S><ResourcesToolbar /></S>} />
    </Routes>
  </>
}

export default function Layout() {
  useApi()
  const as = useStore(state => state.as);
  const error = useStore(state => state.apiError);
  const user = useStore(state => state.res.users_get_response?.first)
	const navigate = useNavigate()


  useEffect(() => {
    // FIXME only do after first load
    if (as) {navigate('/j')}
  }, [as])

  if (!user) {return null}

  return <div key={as}>
    {/* TODO put these in drawer */}
    <PersistentDrawerLeft>
      <Error message={error} />
      <Error codes={[422,401,500]} />
    </PersistentDrawerLeft>
  </div>
}
