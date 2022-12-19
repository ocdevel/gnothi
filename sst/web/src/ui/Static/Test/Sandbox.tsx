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
    ctas: undefined,
    userMenu: true
  }

  const splash = {
    links: [],
    title: undefined,
    ctas: [
      {name: "Sign Up", fn: () => {}},
      {name: "Log In", fn: () => {}}
    ],
    userMenu: false
  }

  const modal = {
    links: [],
    title: "Sharing",
    ctas: [{
      name: "Save",
      fn: () => alert("Saved!")
    }],
    userMenu: false,
    onClose: () => alert("closed")
  }

  const journal = {
    links: [
      {name: "Dashboard", to: "/"},
      {name: "Sharing", to: "/"},
      {name: "Resources", to: "/"},
    ],
    title: undefined,
    ctas: [{
      name: "New Entry",
      fn: () => {}
    }],
    userMenu: true
  }

  const props = {
    app,
    splash,
    modal,
    journal
  }

  return <>
    <AppBar {...props[bar]} />
    <Toolbar />
    <Stack spacing={2} direction="row">
      {Object.keys(props).map(name => (
        <Button variant="contained" onClick={() => setBar(name)}>
          {name}
        </Button>
      ))}
    </Stack>
  </>
}
