import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {Link, Outlet, useLocation} from "react-router-dom";
import Button from "@mui/material/Button";
import {useCallback, useEffect, useMemo} from "react";
import {useStore} from "../../../data/store";
import {useForm} from "react-hook-form";
import {fields_post_request} from "@gnothi/schemas/fields.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {shallow} from "zustand/shallow";
import {UpsertModal} from "./Upsert/Upsert.tsx";
import {TimerModal} from "./Track/Timer.tsx"

export default function Layout() {
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
  const location = useLocation()

  useEffect(() => {
    if (!fields?.ids?.length) { return }
    send('fields_entries_list_request', {day: dayStr})
  }, [
    dayStr,
    // trigger if fields are different (CRUD, reorder, etc)
    fields?.ids?.slice().sort().join()
  ])

  const navbar = useMemo(() => {
    return <Box sx={{display: "flex", justifyContent: "center", gap: 2}}>
      <Button
        component={Link}
        to="/b"
        variant={location.pathname === "/b" ? "outlined" : "text"}
      >
        Track
      </Button>
      <Button
        component={Link}
        to="/b/analyze"
        variant={location.pathname === "/b/analyze" ? "outlined" : "text"}
      >
        Analyze
      </Button>
    </Box>

  }, [location.pathname])

  const upsertModal = useMemo(() => <UpsertModal />, [])
  const timerModal = useMemo(() => <TimerModal />, [])

  return <>
    <Container maxWidth={false}>
      {navbar}
      <Outlet />
    </Container>
    {upsertModal}
    {timerModal}
  </>
}