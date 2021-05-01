import React, {useEffect, useState} from "react";
import {Table} from "react-bootstrap";
import _ from "lodash";
import regression from 'regression';
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, ResponsiveContainer,
  Area, AreaChart, ComposedChart, Scatter, BarChart, Bar, Legend, Brush, ReferenceLine} from "recharts";
import moment from 'moment'

import {useStoreState, useStoreActions} from "easy-peasy";
import {FieldName} from "./utils";
import {BasicDialog, FullScreenDialog} from "../Helpers/Dialog";
import {DialogContent, DialogTitle} from "@material-ui/core";

const round_ = (v) => v ? v.toFixed(2) : null

export default function ChartModal({close, field=null, overall=false}) {
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)
  const history = useStoreState(s => s.ws.data['fields/history/get'])

  const fields = useStoreState(s => s.ws.data['fields/fields/get'])
  const influencers = useStoreState(s => s.ws.data['insights/influencers/get'])

  useEffect(() => {
    if (field) {
      emit(['fields/history/get', {id: field.id}])
    }
  }, [field])

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
      <Table striped size="sm">
        <thead>
        <tr>
          <th>Field</th>
          <th>Importance</th>
          <th>Avg</th>
          <th>Predicted Next</th>
        </tr>
        </thead>
        <tbody>
        {_(influencers_)
          .toPairs()
          .filter(x => x[1] > 0)
          .orderBy(x => -x[1])
          .value()
          .map(x => <tr key={x[0]}>
            <td><FieldName name={fields[x[0]].name} maxWidth={250} /></td>
            <td>{ round_(x[1]) }</td>
            <td>{ round_(fields[x[0]].avg) }</td>
            <td>{ round_(fields[x[0]].next_pred) }</td>
          </tr>)}
        </tbody>
      </Table>
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

  return (
    <FullScreenDialog
      open={true}
      onClose={close}
      title={field ? "Influencers" : "Top Influencers"}
    >
      {field && <DialogTitle><FieldName name={field.name} maxWidth={960} /></DialogTitle>}
      <DialogContent>
        {renderBody()}
      </DialogContent>
    </FullScreenDialog>
  );
}
