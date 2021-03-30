import {useStoreActions, useStoreState} from "easy-peasy";
import {Form} from "react-bootstrap";
import _ from "lodash";
import React from "react";

export default function Groups({groups, setGroups}) {
  const emit = useStoreActions(a => a.ws.emit)
  const myGroups = useStoreState(s => s.ws.data['groups/mine/get'])

  if (!myGroups) {return null}

  const check = k => e => {
    setGroups({...groups, [k]: e.target.checked})
  }

  return <Form.Group>
    <Form.Label>Groups</Form.Label>
    {_.map(myGroups, (v, k) => (
        <Form.Check
          key={v.id}
          id={`groups-${v.id}`}
          type="checkbox"
          label={v.title}
          checked={groups[v.id]}
          onChange={check(v.id)}
        />
    ))}
  </Form.Group>
}
