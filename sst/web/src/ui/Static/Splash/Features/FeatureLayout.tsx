import {Section, Skeleton2} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Prompt from "./Prompt"
import BehaviorTracking from "./BehaviorTracking";
import Organization from "./Organization";
import Books from "./Books";
import FreeVsPremium from "./FreeVsPremiumBlurb";
import ThemesSummaries from "./ThemesSummaries";
import PremPricingCTA from "./PremPricingCTA";

const {spacing, colors, sx} = styles

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}





export default function FeatureLayout() {
    return <Box
      sx={{ mt: 10}}>
      <Typography
          variant="h2"
          textAlign='center'
          sx={{mb:2}}
      >
        Explore the features and compare plans
      </Typography>

      <BasicTabs/>


    </Box>
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function BasicTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', bgcolor: 'transparent' }}>
      <Tabs value={value} onChange={handleChange} centered>
        <Tab label="Premium" />
        <Tab label="Basic" />
        <Tab label="Pricing" />
      </Tabs>

    </Box>
      <TabPanel value={value} index={0}>
        {/* <FreeVsPremium/> */}
        <Prompt/>
        <BehaviorTracking/>
        <ThemesSummaries/>
        <Organization/>
        <Books/>
        <PremPricingCTA/>
      </TabPanel>

      <TabPanel value={value} index={1}>
        Item Two
      </TabPanel>

      <TabPanel value={value} index={2}>
        Item Three
      </TabPanel>

    </Box>
  );
}


