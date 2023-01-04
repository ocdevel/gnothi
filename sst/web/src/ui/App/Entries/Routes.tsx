import React, {lazy, useEffect} from 'react'
import {useParams} from "react-router-dom";
import {S, Error, Loading} from '../../Components/Routing'
import {useStore} from "../../../data/store";
import Layout from "./Layout"
import Insights from "./List"
import New from "./Upsert/New"
// import {EntriesRouter as ModalRouter} from "./Modal"

const defaults = {errorElement: <Error />}

const routes = [
  {path: "j", ...defaults, element: <Layout />, children: [
    {index: true, ...defaults, element: <Insights />},
    // {path: ":entry_id/:mode", ...defaults, element: <ModalRouter />},
  ]}
]

export default routes
