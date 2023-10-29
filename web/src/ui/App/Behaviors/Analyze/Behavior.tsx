import {shallow} from "zustand/shallow";
import React, {PropsWithChildren, useCallback} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {BehaviorName} from "../BehaviorName.tsx";
import {useStore} from "../../../../data/store";

interface Item {
  onClick: () => void
  active: boolean
}
function Item({onClick, active, children}: PropsWithChildren<Item>) {
  return <Card
    onClick={onClick}
    sx={{cursor: "pointer", mb: 1}}
  >
    <CardContent
      sx={{
        backgroundColor: active ? undefined : "white"
      }}
    >
      {children}
    </CardContent>
  </Card>
}

export function Overall() {
  const view = useStore(s => s.behaviors.view?.view)
  const setView = useStore(useCallback(s => s.behaviors.setView, []))
  const onClick = useCallback(() => {
    setView({view: "overall", fid: null})
  }, [])
  return <Item onClick={onClick} active={view === "overall"}>
    <BehaviorName name={"**Overall Analysis**"} />
  </Item>
}

export function Behavior({fid}: {fid: string}) {
  const [
    behavior,
    view,
  ] = useStore(s => [
    s.res.fields_list_response?.hash?.[fid],
    s.behaviors.view
  ], shallow)
  const [
    setView
  ] = useStore(useCallback(s => [
    s.behaviors.setView
  ], []))

  const onClick = useCallback(() => {
    setView({view: "view", fid})
  }, [])

  return <Item
    onClick={onClick}
    active={view.view === "view" && view.fid === fid}
  >
    <BehaviorName name={behavior.name} />
  </Item>
}