import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {Link, Outlet} from "react-router-dom";
import Button from "@mui/material/Button";
import {useCallback, useEffect} from "react";
import {useStore} from "../../../data/store";

export function Layout() {
  const fields = useStore(s => s.res.fields_list_response?.rows)
  const dayStr = useStore(s => s.behaviors.dayStr)
  const send = useStore(useCallback(s => s.send, []))

  const areFieldsDifferent = fields?.map(f => f.id).sort().join()

  useEffect(() => {
    if (!fields?.length) { return }
    send('fields_entries_list_request', {day: dayStr})
  }, [dayStr, areFieldsDifferent])

  return <Container maxWidth={false}>
    <Box sx={{display: "flex", justifyContent: "center", gap: 2}}>
      <Button component={Link} to={"/behaviors"}>Track</Button>
      <Button component={Link} to={"/behaviors/analyze"}>Analyze</Button>
    </Box>
    <Outlet />
  </Container>
}