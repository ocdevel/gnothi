 import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Behavior from '../../Behaviors/List/Item.tsx'
import React, {useEffect, useState} from "react";
import {FieldName} from "../../Behaviors/utils";
import Expand from '@mui/icons-material/FullscreenOutlined'
import { PieChart, XAxis, YAxis, Pie, Legend, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';


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

  let pieData = _.reduce(fields, (m, field, fid) => {
    // keep only the top scores. At the end, if nothing meets the threshold, we show the "collect more data" component
    if (!(field.influencer_score > .05)) {return m}
    return [...m, {name: field.name, value: field.influencer_score}]
  }, [])

  function renderChart() {
    return <Box display="flex" flexDirection="column" flexGrow={1}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={400} height={400}>
          <Pie
            dataKey="value"
            data={pieData}
            fill="#8884d8"
            label={({name}) => name}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  }

  function renderEmpty() {
    return <Typography>You have no behaviors to track, click <FullscreenOutlined size={25} /> to add some.</Typography>
  }

  function renderList() {
    return fields?.ids?.map(fid => <Behavior key={fid} fid={fid}/>)
  }

  return <div className="dashboard">
    {
      pieData.length ? renderChart()
      : fields?.length ? renderList()
      : renderEmpty()
    }
  </div>
}
