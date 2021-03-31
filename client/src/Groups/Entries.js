import {useStoreState} from "easy-peasy";
import React, {useEffect, useState} from "react";
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom";
import _ from "lodash";
import {Alert, Button, ButtonGroup, Card, Col, Form, InputGroup, Row} from "react-bootstrap";
import {FaSearch} from "react-icons/fa";
import {EntryPage} from "../Entries/Entry";
import {MainTags} from "../Tags";
import MediaQuery from "react-responsive";
import {bsSizes} from "../utils";
import Sidebar from "../Sidebar";
import {NotesAll} from "../Entries/Notes";

import {EntryTeaser} from '../Entries/Entries'
import {Entry} from '../Entries/Entry'

export default function Entries() {
  const entries = useStoreState(s => s.ws.data['groups/entries/get'])

  function open() {}


}
