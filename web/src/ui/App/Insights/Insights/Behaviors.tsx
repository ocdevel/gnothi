 import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Behavior from '../../Behaviors/Track/Behavior.tsx'
import React, {useEffect, useState} from "react";
import {FieldName} from "../../Behaviors/utils";
import Expand from '@mui/icons-material/FullscreenOutlined'
import { PieChart, Pie, Legend, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';



import _ from "lodash";
 import {FullscreenOutlined} from "@mui/icons-material";

// import {FieldName} from "./utils";

export default function Dashboard() {
  const [send, user, fields, entries, day, isToday, view, setView] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response?.rows,
    s.res.fields_entries_list_response?.hash,
    s.behaviors.day,
    s.behaviors.isToday,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  function showModal() {
    setView({
      page: "modal",
      view: "overall",
      fid: null
    })
  }

  const as = useStore(state => state.user?.as)

  // const influencers = useStore(s => s.res.fields_influencers_list_response?.rows)

  const maxInfluencers = 5
  let data = _.reduce(fields, (m, field, fid) => {
    // keep only the top scores. At the end, if nothing meets the threshold, we show the "collect more data" component
    if (!(field.influencer_score > .0001)) {return m}
    return [...m, {name: field.name, score: field.influencer_score}]
  }, []).slice().sort((a: number, b: number) => b.score - a.score).slice(0, maxInfluencers)

  const hasInfluencers = data.length > 0
  const hasFields = fields?.length > 0

  function renderChart() {
    return <Box width="100" height={250}>
     <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{
          top: 5, right: 5, left: 5, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Tooltip />
        <Legend />
        <Bar dataKey="score" fill="#50577a" />
      </BarChart>
    </ResponsiveContainer>
    </Box>
  }

  function renderEmpty() {
    return <Typography>You have no behaviors to track, click <FullscreenOutlined size={25} /> to add some.</Typography>
  }

  function renderList() {
    // return <Typography>Not enough data to compute behavior statistics, keep tracking and check back in a few days</Typography>

    // remove habitica to save space
    const customFields = fields?.filter(f => !f.service?.length)
    return customFields?.map(f => <Behavior key={f.id} fid={f.id}/>)
  }

  return <div className="dashboard">
    {
      hasInfluencers ? renderChart()
      : hasFields ? renderList()
      : renderEmpty()
    }
  </div>
}
