import React, {useState, useEffect} from 'react'
import {Routes, Route, Outlet} from 'react-router-dom'
import {useStore} from "@gnothi/web/src/data/store"
import EditModal from './View/Edit'
import {ViewModal} from './List/ViewModal.tsx'


export default function Layout() {
  const send = useStore(s => s.send)

  useEffect(() => {
    send('groups_list_request', {})
    send('groups_mine_list_request', {})
  }, [])

  return <div className='groups'>
    <Outlet />
    <ViewModal />
    <EditModal />
  </div>
}
