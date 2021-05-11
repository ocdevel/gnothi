import React from "react";
import Box from "@material-ui/core/Box";
import Tab from "@material-ui/core/Tab";
import TabList from '@material-ui/lab/TabList';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';

// {value, label, render}
export default function Tabs({tabs, defaultTab=null}) {
  const [value, setValue] = React.useState(defaultTab);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return <Box sx={{ width: '100%', typography: 'body1' }}>
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList onChange={handleChange} aria-label="Tabs">
          {tabs.map(t => <Tab
            label={t.label}
            value={t.value}
            key={t.value}
          />)}
        </TabList>
      </Box>
      {tabs.map(t => <TabPanel
        value={t.value}
        key={t.value}
      >
        {t.render()}
      </TabPanel>)}
    </TabContext>
  </Box>
}
