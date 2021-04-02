import {useStoreActions, useStoreState} from "easy-peasy";
import {Form} from "react-bootstrap";
import _ from "lodash";
import React from "react";

export default function Groups({groups, setGroups}) {
  const emit = useStoreActions(a => a.ws.emit)
  const {arr, obj} = useStoreState(s => s.ws.data['groups/mine/get'])

  if (!arr?.length) {return null}

  const check = k => e => {
    setGroups({...groups, [k]: e.target.checked})
  }

  return <Form.Group>
    <Form.Label>Groups</Form.Label>
    {arr.map(gid => (
        <Form.Check
          key={gid}
          id={`groups-${gid}`}
          type="checkbox"
          label={obj[gid].title}
          checked={groups[gid]}
          onChange={check(gid)}
        />
    ))}
  </Form.Group>
}
