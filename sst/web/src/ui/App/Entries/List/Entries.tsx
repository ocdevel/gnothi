import React, {useCallback, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import _ from 'lodash'

import Teaser from './Teaser'
import {useStore} from '../../../../data/store'

import Pagination from '@mui/material/Pagination'
import Button from '@mui/material/Button'
import {Alert2} from "../../../Components/Misc";


export default function Entries({group_id=null}) {
  const entries = useStore(s => s.res.entries_list_response)
  const search_response = useStore(s => s.res.insights_search_response?.hash?.list)

  const ids = entries?.ids || []
  const hash = entries?.hash || {}

  const [page, setPage] = useState(0)

  let navigate = useNavigate()

  useEffect(() => {
    setPage(0)
  }, [entries])

  if (entries?.res?.error && entries.res.code === 403) {
    return <h5>{entries.res.data}</h5>
  }

  let filtered: string[] = ids
  if (search_response) {
    filtered = search_response.entry_ids
  }

  if (!filtered.length) {
    return <Alert2 severity='info'>No entries. If you're a new user, click <Button color="primary" size='small' variant='contained' disabled>New Entry</Button> above. If you're a therapist, select a client in left-sidebar {'>'} Account {'>'} [email]. You'll then be in that client's shoes.</Alert2>
  }

  const pageSize = 30
  // const usePaging = !search.length && filtered.length > pageSize
  const usePaging = filtered.length > pageSize
  const filteredPage = !usePaging ? filtered :
      filtered.slice(page*pageSize, page*pageSize + pageSize)
  const nPages = _.ceil(filtered.length / pageSize)
  function changePage (e: React.ChangeEvent<unknown>, p: number) {
    setPage(p)
  }

  return <>
    {filteredPage.map(eid => <Teaser eid={eid} key={eid}/> )}
    {usePaging && <Pagination count={nPages} page={page} onChange={changePage} />}
  </>
}
