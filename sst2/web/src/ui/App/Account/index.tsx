import {Route, Routes} from "react-router-dom"
import React from "react"
import Profile from "./Profile"

export default function Account() {
  return (
    <Routes>
      {/* TODO ensure relative path here works like that. Otherwise /account/profile */}
      <Route path='profile' element={<Profile />} />
      {/*<Route path={`${match.url}/sharing`}>
        <Sharing />
      </Route>*/}
    </Routes>
  )
}
