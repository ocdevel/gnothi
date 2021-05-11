import React from "react";
import {Box, Tab} from "@material-ui/core";
import {TabList, TabPanel, TabContext} from '@material-ui/lab';

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
