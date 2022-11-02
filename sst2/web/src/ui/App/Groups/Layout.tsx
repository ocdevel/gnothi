import React, {useState, useEffect} from 'react'
import {Routes, Route, Outlet} from 'react-router-dom'
import {useStore} from "@gnothi/web/src/data/store"

export default function Layout() {
  const send = useStore(s => s.send)

  useEffect(() => {
    send('groups_list_request', {})
  }, [])

  return <div className='groups'>
    <Outlet />
  </div>
}
