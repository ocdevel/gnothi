import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {Link, Outlet} from "react-router-dom";
import Button from "@mui/material/Button";
import {useCallback, useEffect, useMemo} from "react";
import {useStore} from "../../../data/store";
import {useForm} from "react-hook-form";
import {fields_post_request} from "@gnothi/schemas/fields.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {shallow} from "zustand/shallow";
import {UpsertModal} from "./Upsert/Upsert.tsx";

export function Layout() {
  const [
    fields,
    dayStr,
    view
  ] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.dayStr,
    s.behaviors.view
  ], shallow)
  const [
    send,
  ] = useStore(useCallback(s => [
    s.send,
  ], []))

  useEffect(() => {
    if (!fields?.ids?.length) { return }
    send('fields_entries_list_request', {day: dayStr})
  }, [
    dayStr,
    // trigger if fields are different (CRUD, reorder, etc)
    fields?.ids?.slice().sort().join()
  ])

  return <>
    <Container maxWidth={false}>
      <Box sx={{display: "flex", justifyContent: "center", gap: 2}}>
        <Button component={Link} to={"/behaviors"}>Track</Button>
        <Button component={Link} to={"/behaviors/analyze"}>Analyze</Button>
      </Box>
      <Outlet />
    </Container>
    {useMemo(() => <UpsertModal />, [])}
  </>
}