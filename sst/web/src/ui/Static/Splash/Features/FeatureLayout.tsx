import {Section, Skeleton2} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import * as React from 'react';
import Prompt from "./Prompt"
import BehaviorTracking from "./BehaviorTracking";
import Organization from "./Organization";
import Books from "./Books";
import FreeVsPremium from "./FreeVsPremiumBlurb";
import ThemesSummaries from "./ThemesSummaries";
import PremPricingCTA from "./PremPricingCTA";
import OrganizationBasicPlan from "./OrganizationBasicPlan";
import PlanComparison from "./PlanComparison";
import {useStore} from '../../../../data/store'
import Tabs from '../../../Components/Tabs'
import {shallow} from "zustand/shallow";


const {spacing, colors, sx} = styles


export default function FeatureLayout() {
  return <Box
    sx={{mt: 10}}>
    <Typography
      variant="h2"
      textAlign='center'
      sx={{mb: 2}}
    >
      Explore the features and compare plans
    </Typography>
    <BasicTabs/>
  </Box>
}

export function BasicTabs() {
  const [me] = useStore(s => [s.user?.me], shallow)
  const extraTabs = me ? [] : [{
    value: "pricing",
    label: "Pricing",
    render: () => <>
      <PlanComparison/>
    </>
  }]

  return <Box sx={{width: '100%'}}>
    <Box sx={{width: '100%', backgroundColor: 'transparent'}}>
      <Tabs
        defaultTab="premium"
        tabs={[{
          value: "free",
          label: "Free",
          render: () => <>
            <Books/>
            <BehaviorTracking/>
            <ThemesSummaries/>
            <OrganizationBasicPlan/>
            <PremPricingCTA/>
          </>
        }, {
          value: "premium",
          label: "Premium",
          render: () => <>
            <Prompt/>
            <BehaviorTracking/>
            <ThemesSummaries/>
            <Organization/>
            <Books/>
            <PremPricingCTA/>
          </>
        },
        ...extraTabs
        ]}
      />
    </Box>
  </Box>
}


