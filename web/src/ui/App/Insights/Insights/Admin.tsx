import React, {useCallback, useEffect, useState} from "react"
import {sent2face} from "@gnothi/web/src/utils/utils"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStore} from "@gnothi/web/src/data/store"
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {LinearProgress} from "@mui/material";
import {Insight} from "./Utils";
import Divider from "@mui/material/Divider";

export default function Themes({view}: Insight) {
  const me = useStore(s => s.user?.me)
  const send = useStore(s => s.send)
  const analytics = useStore(useCallback(s => s.res.admin_analytics_list_response?.first, []))

  if (!analytics) {
    return <LinearProgress />
  }

  function renderRow(col: string, val: number) {
    return <TableRow>
      <TableCell>{col}</TableCell>
      <TableCell>{val}</TableCell>
    </TableRow>
  }

  return <TableContainer component={Paper}>
    <Table>
      <TableBody>
        {renderRow("Users", analytics.n_users)}
        {renderRow("Users v1", analytics.n_users_v1)}
        {renderRow("Users v0 returning", analytics.n_users_v0_returning)}
        {renderRow("Entries", analytics.n_entries)}
        {renderRow("Entries v1", analytics.n_entries_v1)}
        {renderRow("Notes", analytics.n_notes)}
        {renderRow("Notes v1", analytics.n_notes_v1)}
        {renderRow("Bookshelf", analytics.n_bookshelf)}
        {renderRow("Bookshelf v1", analytics.n_bookshelf_v1)}
        {renderRow("Premium", analytics.n_premium)}
      </TableBody>
    </Table>
  </TableContainer>
}
