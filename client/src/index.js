import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App'

// matchMedia() polyfill, for react-responsive
// (TODO do I need this?)
import 'matchmedia-polyfill'
import 'matchmedia-polyfill/matchMedia.addListener'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
