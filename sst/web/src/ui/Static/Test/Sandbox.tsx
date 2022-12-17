import React, {useState, useEffect} from 'react'
import AppBar from '../../Components/AppBar'
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

export default function Sandbox() {
  const [bar, setBar] = useState<"app" | "splash" | "modal">("app")

  const app = {
    links: [
      {name: "Dashboard", to: "/"},
      {name: "Sharing", to: "/"},
      {name: "Resources", to: "/"},
    ],
    title: undefined,
    cta: undefined,
    userMenu: true
  }

  const splash = {
    links: [],
    title: undefined,
    cta: undefined,
    userMenu: false
  }

  const modal = {
    links: [],
    title: "Sharing",
    cta: {
      name: "Save",
      fn: () => alert("Saved!")
    },
    userMenu: false,
    onClose: () => alert("closed")
  }

  const props = {
    app,
    splash,
    modal
  }[bar]

  return <>
    <AppBar {...props} />
    <Toolbar />
    <Stack spacing={2} direction="row">
      {(["app", "splash", "modal"] as const).map(name => (
        <Button variant="contained" onClick={() => setBar(name)}>
          {name}
        </Button>
      ))}
    </Stack>
  </>
}
