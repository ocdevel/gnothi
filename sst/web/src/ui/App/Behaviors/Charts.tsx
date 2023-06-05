import React, {useEffect, useState} from "react";
import _ from "lodash";
import regression from 'regression';
import {CartesianGrid, Line, Tooltip, XAxis, YAxis, ResponsiveContainer,
  ComposedChart, Bar, Legend, Brush, ReferenceLine} from "recharts";
import moment from 'moment'

import {useStore} from "@gnothi/web/src/data/store"
import {FieldName} from "./utils";
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

const round_ = (v: number | null) => v ? v.toFixed(2) : null

export default function Charts() {
  const [showChart, setShowChart] = useStore(s => [
    s.behaviors.showChart, s.behaviors.setShowChart
  ], shallow)
  const as = useStore(state => state.user.as)
  const send = useStore(s => s.send)
  const history = useStore(s => s.res.fields_history_list_response?.data)

  const fields_ = useStore(s => s.res.fields_list_response)
  const influencers = useStore(s => s.res.fields_influencers_list_response?.rows)

  const fields = fields_?.rows || []
  const hash = fields_?.hash || {}
  const field = (showChart === "overall" || showChart === false) ? null
    : hash?.[showChart]
  const overall = showChart === "overall"


  useEffect(() => {
    if (field) {
      send('fields_history_list_request', {id: field.id})
    }
  }, [field])

  if (showChart === false) { return null }
  if (!overall && !field) { return null }

  const close = React.useCallback(() => setShowChart(false), [])

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

  const renderChart = () => {
    if (history.length < 1) {return}

    // add trend-line https://github.com/tom-alexander/regression-js#readme
    // returns [equation, string, points, r2, predict()]
    let data = history.map((d, i) => [i, d.value])
    const result = regression.linear(data, {precision: 9})
    const points = result.points

    const thisYear = moment().format('YYYY')
    let [hasNeg, hasPos] = [false, false] // will add a reference line if both positive/negative values present
    data = history.map((d, i) => {
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
      bar: "#8884d8",
      trend: "green", //"#82ca9d"
      scroller: "#8884d8",
      xAxis: null, //"#000",
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
        {renderInfluencers()}
      </div>}
      {overall && renderInfluencers()}
    </>
  }

  return <>
    <Typography variant="h4">{field ? "Influencers" : "Top Influencers"}</Typography>
    {field && <Typography variant="h5"><FieldName name={field.name} maxWidth={960} /></Typography>}
    {renderBody()}
  </>
}
