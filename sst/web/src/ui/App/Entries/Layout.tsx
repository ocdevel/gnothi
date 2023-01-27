import {Outlet} from 'react-router-dom'

export default function Layout() {
  return <div className="entries">
    <Outlet />
  </div>
}
