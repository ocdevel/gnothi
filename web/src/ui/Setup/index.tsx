import React, {useState, useEffect, useRef} from 'react'
import '../App.scss'
import Mui from "./Mui";
import Routing from "./Routing";
import {AuthProvider} from './Auth'
import {HelmetProvider} from 'react-helmet-async'

// extend dayjs with timezone support, for later dayjs usage
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
dayjs.extend(utc)
dayjs.extend(timezone)

import {Amplify} from "aws-amplify";
import {awsConfig} from "../../utils/config.ts";
import "@aws-amplify/ui-react/styles.css";
import "./Auth.scss"
Amplify.configure(awsConfig);

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
