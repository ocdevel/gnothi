import React, {useState, useEffect, useRef} from 'react'
// import '@aws-amplify/ui-react/dist/styles.css'
import '../App.scss'
import Mui from "./Mui";
import Routing from "./Routing";
import {AuthProvider} from './Auth'
import {HelmetProvider} from 'react-helmet-async'

// moved to inside SetupRouter, since it needs RouterProvider which can't take children
// import SetupInit from "./SetupInit";

export default function Index() {
  return <HelmetProvider>
    <Mui>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </Mui>
  </HelmetProvider>
}
