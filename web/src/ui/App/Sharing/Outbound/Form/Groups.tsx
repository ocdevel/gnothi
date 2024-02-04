import {useStore} from "@gnothi/web/src/data/store"
import React, {useCallback} from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import {useShallow} from "zustand/react/shallow";

type Hash = {[key: string]: boolean}
export default function Groups() {
  const [
    g,
    groups,
  ] = useStore(useShallow(s => [
    s.res.groups_mine_list_response,
    s.sharing.form.groups
  ]))
  const [
    send,
    setGroups
  ] = useStore(useCallback(s => [
    s.send,
    s.sharing.form.setGroups
  ]))

  if (!g?.ids?.length) {return null}

  const {hash, ids} = g

  const check = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroups({...groups, [k]: e.target.checked})
  }

  return <div>
    <Typography variant='button'>Groups</Typography>
    <div>
      <FormControl>
      {ids.map(gid => <FormControlLabel
        key={gid}
        label={hash[gid].title}
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
