import * as React from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import {useMediaQuery} from "react-responsive";
import {useStoreState} from "easy-peasy";
import {aiStatusEmoji} from "../Helpers/utils";

import Sections from './Sections'
import {Route, Switch, useLocation} from "react-router-dom";
import Tooltip from "@material-ui/core/Tooltip";
import {EntriesToolbar} from "../Entries/Entries";
import {GroupsToolbar} from "../Groups/AllGroups";
import {InsightsToolbar} from "../Insights";
import {ResourcesToolbar} from "../Resources";
import {GroupToolbar} from "../Groups/Group";


const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  hide: {
    display: 'none',
  },
  drawer: {
    //minHeight: '100vh',
    // overflowY: 'scroll',
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'space-between',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
}));

function SidebarBrand() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)

  let aiStatus_ = null
  if (~['off', 'pending'].indexOf(aiStatus)) {
    aiStatus_ = {
      off: "AI server is offline",
      pending: "AI server is coming online"
    }[aiStatus]
    aiStatus_ = <Tooltip title={aiStatus_} placement='right'>
      <span>{aiStatusEmoji(aiStatus)}</span>
    </Tooltip>
  }
  return <Typography variant="h6" component="div">
    Gnothi {aiStatus_}
  </Typography>
}

export default function PersistentDrawerLeft({children}) {
  const location = useLocation()
  const classes = useStyles();
  const isDesktop = useMediaQuery({ minWidth: 960 })
  const [open, setOpen] = React.useState(isDesktop);

  const toggleDrawer = () => setOpen(!open)

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          <Switch>
            <Route path='/j'><EntriesToolbar /></Route>
            <Route exact path='/groups'><GroupsToolbar /></Route>
            <Route exact path='/insights'><InsightsToolbar /></Route>
            <Route exact path='/resources'><ResourcesToolbar /></Route>
            <Route path='/groups/:gid'><GroupToolbar /></Route>
          </Switch>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          <SidebarBrand />
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />

        <Sections />
      </Drawer>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}
      >
        <div className={classes.drawerHeader} />
        {children}
      </main>
    </div>
  );
}
