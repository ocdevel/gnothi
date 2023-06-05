 import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Behavior from '../../Behaviors/List/Item.tsx'
import React, {useEffect, useState} from "react";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import {FieldName} from "../../Behaviors/utils";

import _ from "lodash";
import {Tooltip, XAxis, YAxis, ResponsiveContainer, Pie,
  ComposedChart, Bar, Legend, Brush, ReferenceLine} from "recharts";

// import {FieldName} from "./utils";

const round_ = (v: number | null) => v ? v.toFixed(2) : null

function PieChart() {
  const field = null
  const as = useStore(state => state.user?.as)
  const send = useStore(s => s.send)

  const fields_ = useStore(s => s.res.fields_list_response)
  const influencers = useStore(s => s.res.fields_influencers_list_response?.rows)

  const fields = fields_?.rows || []
  const hash = fields_?.hash || {}


  let influencers_ = _.isEmpty(influencers) ? false
    : field ? influencers[field.id]
    : _.reduce(fields, (m,v,k) => {
        m[k] = v.influencer_score
        return m
      }, {})

  const renderInfluencers = () => {
    if (!influencers_) {
      return <p>
        After you've logged enough field entries, this feature will show you which fields influence this field. If you're expecting results now, make sure you set fields as <strong>target</strong> (edit the field), then wait an hour or two. Influencers only calculate for target fields.
      </p>
    }
    return <>
      <TableContainer component={Paper}>
        <Table striped size="small">
          <TableHead>
            <TableRow>
              <TableCell>Field</TableCell>
              <TableCell>Importance</TableCell>
              <TableCell>Avg</TableCell>
              <TableCell>Predicted Next</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {_(influencers_)
              .toPairs()
              .filter(x => x[1] > 0)
              .orderBy(x => -x[1])
              .value()
              .map(x => <TableRow key={x[0]}>
                <TableCell><FieldName name={fields[x[0]].name} maxWidth={250} /></TableCell>
                <TableCell>{ round_(x[1]) }</TableCell>
                <TableCell>{ round_(fields[x[0]].avg) }</TableCell>
                <TableCell>{ round_(fields[x[0]].next_pred) }</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  }

  return <>
    {renderInfluencers()}
  </>
}




export default function Dashboard() {
  const [send, user, fields, entries, day, isToday, view, setView] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
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

  function renderEmpty() {
    return <Box>
      <Typography>You have no behaviors to track</Typography>
    </Box>
  }

  function renderList() {
    return <>
      {fields?.ids?.map(fid => <Behavior key={fid} fid={fid}/>)}
    </>
  }

  return <div className="dashboard">
    <PieChart />
    {fields?.ids?.length ? renderList() : renderEmpty()}

    {/*<Button
      className="btn-expand"
      variant="contained"
      onClick={showModal}
    >
      Dive Deeper
    </Button>*/}
  </div>
}
