import {shallow} from "zustand/shallow";
import React, {useCallback} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {FieldName} from "../utils.tsx";
import {useStore} from "../../../../data/store";

export function Behavior({fid}: {fid: string}) {
  const [
    behavior,
  ] = useStore(s => [
    s.res.fields_list_response?.hash?.[fid],
  ], shallow)
  const [
    setView
  ] = useStore(useCallback(s => [
    s.behaviors.setView
  ], []))

  const onClick = useCallback(() => {
    setView({view: "view", fid})
  }, [])

  return <Card
    sx={{mb:1}}
    onClick={onClick}
  >
    <CardContent
      sx={{backgroundColor: "white"}}
    >
      <FieldName name={behavior.name} />
    </CardContent>
  </Card>
}