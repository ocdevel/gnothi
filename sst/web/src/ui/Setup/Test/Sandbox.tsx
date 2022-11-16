import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Card, CardContent, CardHeader, TextField, useColorScheme } from '@mui/material';
import { Stack } from '@mui/system';
import Button  from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsIcon from '@mui/icons-material/Directions';


const useCustomField = false

function StandardTitleTextfield() {
  return <TextField 
    InputLabelProps={{
      shrink: true
    }}
    label="Title"
    multiline={true}
    placeholder="Not sure what to name this entry? If you leave the title blank, Gnothi generate one for you after you submit your entry."
  />
}

function CustomTitleTextfield() {
  const [val, setVal] = React.useState("")

  return <Paper
    component="form"
    sx={{
      width: "100%", 
      border: 1, 
      borderColor: "divider", 
      display: "flex", 
      flexDirection: "column",
      backgroundColor: "white",
      p: 2
    }}
  >
    <InputBase
      sx={{ }}
      onChange={e => setVal(e.target.value)}
      value={val}
      placeholder="Title"
      inputProps={{ 'aria-label': 'shark' }}
    />
    {
      val ? null
        : <Typography variant="caption">Not sure what to name this entry? If you leave the title blank, Gnothi generate one for you after you submit your entry.</Typography>
    }
    
  </Paper>
}

function CreatePage () {
  return <Stack spacing={2}>
    <TextField 
    id="date"
    label="Date"
    type="date"
    defaultValue="2017-05-24"
    sx={{ width: 220 }}
    InputLabelProps={{
    shrink: true,}}/>
    
    
    {useCustomField ? <CustomTitleTextfield /> : <StandardTitleTextfield />}


  <Stack>
    <TextField placeholder='Entry'></TextField>

  </Stack>

  <Divider />

  <Stack>
    <Typography variant="h5">Behaviors</Typography>
    <Typography>Field1</Typography>
    <Typography>Field1</Typography>
    <Typography>Field1</Typography>
  </Stack>

  </Stack>
}

function AnalyzePage() {
   return <Stack>
    <TextField placeholder="Searchg"></TextField>
    <Box>Tag1 Tag2 Tag3</Box>
      {[1, 2, 3, 4].map((i) => <Card>
        <CardHeader>Entry Title {i}</CardHeader>
        <CardContent>Entry Content {i}</CardContent>
      </Card>)}
    <Divider sx={{my:5}} />
    <TextField placeholder="# days" />
    <Stack direction="row">
      <Card>
        <CardContent>Themes</CardContent>
        <Button >Generate</Button>
      </Card>
      <Card>
        <CardContent>QA</CardContent>
        <TextField placeholder="your question"></TextField>
      </Card>
      <Card>
        <CardContent>Prompt</CardContent>
      </Card>
      <Card>
        <CardContent>Summarize</CardContent>
      </Card>
      <Card>
        <CardContent>Behaviors?</CardContent>
      </Card>
    </Stack>
  </Stack>
}

const drawerWidth = 240;

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

export default function ResponsiveDrawer(props: Props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [item, setItem] = React.useState("New")

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {['New', 'History'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton onClick={() => setItem(text)}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Journal
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {item === "New" ? <CreatePage /> : <AnalyzePage />}
      </Box>
    </Box>
  );
}
