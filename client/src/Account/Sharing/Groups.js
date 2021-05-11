import {useStoreActions, useStoreState} from "easy-peasy";
import {Form} from "react-bootstrap";
import _ from "lodash";
import React from "react";
import {Checkbox, FormControl, FormControlLabel, FormGroup, Typography} from "@material-ui/core";

export default function Groups({groups, setGroups}) {
  const emit = useStoreActions(a => a.ws.emit)
  const {arr, obj} = useStoreState(s => s.ws.data['groups/mine/get'])

  if (!arr?.length) {return null}

  const check = k => e => {
    setGroups({...groups, [k]: e.target.checked})
  }

  return <div>
    <Typography variant='button'>Groups</Typography>
    <div>
      <FormControl>
      {arr.map(gid => <FormControlLabel
        key={gid}
        label={obj[gid].title}
        control={
          <Checkbox
            checked={groups[gid]}
            onChange={check(gid)}
          />
        }
      />)}
      </FormControl>
    </div>
  </div>
}
