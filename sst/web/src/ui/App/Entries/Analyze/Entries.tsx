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
  const search_response = useStore(s => s.res.analyze_search_response?.rows)
  const selected = useStore(s => s.selectedTags)
  const filters = useStore(s => s.filters)

  const ids = entries?.ids || []
  const hash = entries?.hash || {}

  const [page, setPage] = useState(0)
  const search = filters.search || ""

  let navigate = useNavigate()

  useEffect(() => {
    setPage(0)
  }, [selected])

  if (entries?.res?.error && entries.res.code === 403) {
    return <h5>{entries.res.data}</h5>
  }

  let filtered: string[] = []
  if (search_response) {
    filtered = search_response.map(r => r.id)
  } else {
    filtered = ids
        // FIXME entry_tags
        // .filter(eid => _.reduce(selected, (m, v, k) => hash[eid].tags[k] || m, false))
        .filter(eid => !search.length || ~(hash[eid].entry.title + hash[eid].entry.text).toLowerCase().indexOf(search))

  }

  if (!filtered.length) {
    return <Alert2 severity='info'>No entries. If you're a new user, click <Button color="primary" size='small' variant='contained' disabled>New Entry</Button> above. If you're a therapist, select a client in left-sidebar {'>'} Account {'>'} [email]. You'll then be in that client's shoes.</Alert2>
  }

  const pageSize = 10
  const usePaging = !search.length && filtered.length > pageSize
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
