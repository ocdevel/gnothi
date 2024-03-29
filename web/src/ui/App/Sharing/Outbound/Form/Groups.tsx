import {useStore} from "@gnothi/web/src/data/store"
import React from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";

type Hash = {[key: string]: boolean}
interface Groups {
  groups: Hash
  setGroups: (groups: Hash) => void
}
export default function Groups({groups, setGroups}: Groups) {
  const send = useStore(s => s.send)
  const g = useStore(s => s.res.groups_mine_list_response)

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
