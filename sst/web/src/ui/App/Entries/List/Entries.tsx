import React, {useCallback, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import _ from 'lodash'

import Teaser from './Teaser'
import {useStore} from '../../../../data/store'

import Pagination from '@mui/material/Pagination'
import Button from '@mui/material/Button'
import {Alert2} from "../../../Components/Misc";
import Box from "@mui/material/Box";
import {Loading} from "../../../Components/Routing.tsx";


export default function Entries({group_id=null}) {
  const entries = useStore(s => s.res.entries_list_response)
  const search_response = useStore(s => s.res.insights_search_response?.hash?.list)

  const ids = entries?.ids || []
  const hash = entries?.hash || {}

  const [page, setPage] = useState(1)

  let navigate = useNavigate()

  useEffect(() => {
    setPage(1)
  }, [entries])

  if (!entries?.ids) {
    return <Loading label="entries" />
  }

  if (entries?.res?.error && entries.res.code === 403) {
    return <h5>{entries.res.data}</h5>
  }

  let filtered: string[] = ids
  if (search_response) {
    filtered = search_response.entry_ids
  }

  if (!filtered.length) {
    return <Alert2 severity='info'>Your entries are either still loading or there are no results based on your search. If you're a new user, click <Button color="primary" size='small' variant='contained' disabled>New Entry</Button> to get started.</Alert2>
  }

  filtered = filtered.slice()
    .filter(id => hash[id])
    .sort((idA, idB) => new Date(hash[idB].created_at) - new Date(hash[idA].created_at))

  const page0idx = page - 1
  const pageSize = 10
  // const usePaging = !search.length && filtered.length > pageSize
  const usePaging = filtered.length > pageSize
  const filteredPage = !usePaging ? filtered :
      filtered.slice(page0idx*pageSize, page0idx*pageSize + pageSize)
  const nPages = _.ceil(filtered.length / pageSize)
  function changePage (e: React.ChangeEvent<unknown>, p: number) {
    setPage(p)
  }

  return <div className='entries'>
    {filteredPage.map(eid => <Teaser eid={eid} key={eid}/> )}
    {usePaging && <Pagination count={nPages} page={page} onChange={changePage} />}
  </div>
}
