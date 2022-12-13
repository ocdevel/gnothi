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

import Sidebar from './Sidebar'
import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {S, Loading} from '@gnothi/web/src/ui/Components/Routing'

import {styles} from '../../Setup/Mui'

const EntriesToolbar = React.lazy(() => import("../Entries/Toolbar"))
const GroupsToolbar = React.lazy(() => import ("../Groups/List/Toolbar"))
const GroupToolbar = React.lazy(() => import ("../Groups/View/Toolbar"))
const SharingModal = React.lazy(() => import("../Account/Sharing"))
const EntryModal = React.lazy(() => import("../Entries/Modal"))

import Appbar from './Appbar'

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
      <AppBar
        position="fixed"
        open={open}
        sx={{
            backgroundColor: styles.colors.grey
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
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
          <Divider />
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />
        <Sidebar />
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
    </Routes>
  </>
}

export default function Layout() {
  useApi()
  const as = useStore(state => state.user?.as);
  const error = useStore(state => state.apiError);
  const user = useStore(state => state.user?.me)
	const navigate = useNavigate()


  useEffect(() => {
    // FIXME only do after first load
    if (as) {navigate('/j')}
  }, [as])

  if (!user) {
    return <Loading label="Loading user" />
  }

  return <Box key={as}>
    {/* TODO put these in drawer */}
    <PersistentDrawerLeft>
      <Error message={error} />
      <Error codes={[422,401,500]} />
    </PersistentDrawerLeft>
    <S><SharingModal /></S>
    <S><EntryModal /></S>
  </Box>
}
