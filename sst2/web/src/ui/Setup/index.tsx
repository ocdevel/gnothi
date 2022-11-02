import React, {useState, useEffect, useRef} from 'react'
// import '@aws-amplify/ui-react/dist/styles.css'
import '../App.scss'

// see https://ui.docs.amplify.aws/react/connected-components/authenticator#3-add-the-authenticator

import Mui from "./Mui";
import Routing from "./Routing";
// moved to inside SetupRouter, since it needs RouterProvider which can't take children
// import SetupInit from "./SetupInit";

export default function Index() {
  return <Mui>
    <Routing />
  </Mui>
}
