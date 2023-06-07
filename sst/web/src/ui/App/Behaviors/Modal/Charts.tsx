import React, {useEffect, useMemo, useState} from "react";
import _ from "lodash";
import regression from 'regression';
import {CartesianGrid, Line, Tooltip, XAxis, YAxis, ResponsiveContainer,
  ComposedChart, Bar, Legend, Brush, ReferenceLine} from "recharts";
import moment from 'moment'

import {useStore} from "@gnothi/web/src/data/store"
import {FieldName} from "../utils.tsx";
import {FullScreenDialog} from "@gnothi/web/src/ui/Components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import {fields_list_response} from '@gnothi/schemas/fields'
import {shallow} from "zustand/shallow";
import Typography from "@mui/material/Typography";
import KeepTracking from './KeepTracking'

const round_ = (v: number | null) => v ? v.toFixed(2) : null

export default function Charts() {
  const [
    view,
    fieldsHash,
    historyRows,
    influencersAll,
    send,
    as
  ] = useStore(s => [
    s.behaviors.view,
    s.res.fields_list_response?.hash || {},
    s.res.fields_history_list_response?.rows,
    s.res.fields_influencers_list_response?.rows,
    s.send,
    s.user?.as
  ], shallow)

  useEffect(() => {
    if (view.fid) {
      send('fields_history_list_request', {id: view.fid})
    }
  }, [view.fid])

  const field = view.fid ? fieldsHash?.[view.fid] : null
  const overall = view.view === "overall"

  const influencersFiltered = useMemo<Array<[string,number]>>(() => {
    // since the xgboost cron touches both influencers table and fields.influencer_score, this counts for both
    // "overall" and "field"
    if (_.isEmpty(influencersAll) || _.isEmpty(fieldsHash)) {
      return null
    }

    let chain: typeof _.chain
    if (view.view === "overall") {
      chain = _.chain(fieldsHash).reduce((m,v, k) => ({
        ...m,
        [k]: v.influencer_score
      }), {})
    } else {
      // per-field influencers
      // FIXME do I have this backwards?
      chain = _.chain(influencersAll)
        .filter(v => v.field_id === view.fid)
        .reduce((m,v,k) => ({ ...m, [v.influencer_id]: v.score }), {})
    }
    return chain
      .toPairs()
      .filter(([fid,score]) => score > 0) // remove non-influential fields (majority)
      .orderBy(([fid,score]) => -score)
      .value()

  }, [influencersAll, view])

  if (!influencersFiltered?.length) {
    return <KeepTracking />
  }

  function renderRow(row: Array<string, number>) {
    const [fid, score] = row
    const inf = fieldsHash[fid]
    return <TableRow key={fid}>
      <TableCell><FieldName name={inf.name} maxWidth={250} /></TableCell>
      <TableCell>{ round_(score) }</TableCell>
      <TableCell>{ round_(inf.avg) }</TableCell>
      <TableCell>{ round_(inf.next_pred) }</TableCell>
    </TableRow>
  }

  function renderTable () {
    // TODO remove this, or merge with <KeepTracking />. This code is never reached
    if (!influencersFiltered?.length) {
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
            {influencersFiltered.map(renderRow)}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  }

  const renderChart = () => {
    if (!(historyRows?.length > 0)) {return null}

    // add trend-line https://github.com/tom-alexander/regression-js#readme
    // returns [equation, string, points, r2, predict()]
    let data = historyRows.map((d, i) => [i, d.value])
    const result = regression.linear(data, {precision: 9})
    const points = result.points

    const thisYear = moment().format('YYYY')
    let [hasNeg, hasPos] = [false, false] // will add a reference line if both positive/negative values present
    data = historyRows.map((d, i) => {
      const fmt = moment(d.created_at).format('YYYY') === thisYear ? 'MM-DD' : 'YYYY-MM-DD'
      if (d.value > 0) {hasPos = true}
      if (d.value < 0) {hasNeg = true}
      return {
        x: moment(d.created_at).format(fmt),
        y: d.value,
        trend: points[i][1],
      }
    })

    const colors = {
      bar: "#50577a",
      trend: "green", //"#82ca9d"
      scroller: "#50577a",
      xAxis: "#000", // TODO was `null` in 2019 code, why?
      referenceLine: "#000"
    }

    return <div style={{width:'100%', height: 300}}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
        >
          {/*margin={{ top: 5, right: 30, left: 20, bottom: 5 }}*/}
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend verticalAlign="top"/>
          {/*<Area type="monotone" dataKey="y" stroke="#8884d8"/>*/}
          <Bar dataKey="y" name="Value" fill={colors.bar} />
          <Line type="monotone" dataKey="trend" name="Trend" stroke={colors.trend} dot={false} isAnimationActive={false} />
          {hasNeg && hasPos && <ReferenceLine y={0} stroke={colors.referenceLine} />}
          {/* Adds the scroller. https://jsfiddle.net/alidingling/mc8r7e6p/ */}
          <Brush dataKey='x' height={25} stroke={colors.scroller} />
          <XAxis dataKey="x" angle={-45} stroke={colors.xAxis} />{/*textAnchor: "end"*/}
          <YAxis domain={['dataMin', 'dataMax']} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  }

  const renderBody = () => {
    return <>
      {renderChart()}
      {field && <div>
        <h5>Stats</h5>
        <ul>
          <li>
            Predicted Next Value:{' '}
            {field.next_pred ? round_(field.next_pred) : "<feature available after more field entries>"}
          </li>
          <li>Average/day: {round_(field.avg)}</li>
        </ul>
      </div>}
      {field && <div>
        <h5>Top Influencers</h5>
        {renderTable()}
      </div>}
      {overall && renderTable()}
    </>
  }

  return <>
    <Typography variant="h4">{field ? "Influencers" : "Top Influencers"}</Typography>
    {field && <Typography variant="h5"><FieldName name={field.name} maxWidth={960} /></Typography>}
    {renderBody()}
  </>
}
