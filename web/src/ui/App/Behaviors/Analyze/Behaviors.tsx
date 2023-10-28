import React, {useCallback} from "react";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";
import {Behavior, Overall} from './Behavior.tsx'
import CardContent from "@mui/material/CardContent";
import {FieldName} from "../Utils.tsx";
import Card from "@mui/material/Card";

const laneOrder: Record<"habit"|"daily"|"todo"|"custom", number> = {
  habit: 0,
  daily: 1,
  todo: 2,
  custom: 3
};

export function Behaviors() {
  const [
    behaviors,
  ] = useStore(s => [
    s.res.fields_list_response,
  ], shallow)

  const sorted = (behaviors?.rows || [])
    .slice()
    .sort((a, b) => {
      // First, compare by lane
      const laneComparison = laneOrder[a.lane] - laneOrder[b.lane];
      if (laneComparison !== 0) return laneComparison;

      // If lanes are equal, compare by sort
      return a.sort - b.sort;
    })

  return <>
    <Overall />
    {sorted.map(b => <Behavior fid={b.id} key={b.id}/>)}
  </>
}