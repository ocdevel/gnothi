import {UpsertProps} from "./Utils.tsx";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import React, {useCallback} from "react";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";

export function DeleteButton({form, field, isNew}: UpsertProps) {
  const [
    send,
    destroy,
    setView
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.destroy,
    s.behaviors.setView
  ], []))
  const fid = field?.id

  const destroy_ = useCallback(() => {
    destroy(fid, () => setView({view: null, fid: null}))
  }, [fid])

  if (!fid) {return null}

  return <Button
    className="btn-delete"
    color='error'
    disabled={!!field.service}
    onClick={destroy_}
    size='small'
  >Delete</Button>
}