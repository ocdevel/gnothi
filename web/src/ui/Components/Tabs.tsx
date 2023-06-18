import * as React from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// {value, label, render}
interface Tab {
  value: string
  label: string
  render: () => React.ReactNode
}
interface Tabs {
  tabs: Tab[]
  defaultTab: string
}
export default function Tabs({tabs, defaultTab}: Tabs) {
  const [value, setValue] = React.useState(defaultTab);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return <Box sx={{ width: '100%', typography: 'body1' }}>
    <TabContext value={value}>
      <TabList
        onChange={handleChange}
        centered
        aria-label="Tabs"
      >
        {tabs.map(t => <Tab
          label={t.label}
          value={t.value}
          key={t.value}
        />)}
      </TabList>
      {tabs.map(t => <TabPanel
        value={t.value}
        key={t.value}
      >
        {t.render()}
      </TabPanel>)}
    </TabContext>
  </Box>
}


// TODO add VerticalTabs here https://mui.com/material-ui/react-tabs/#vertical-tabs
