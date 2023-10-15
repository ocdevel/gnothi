import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {Link, Outlet} from "react-router-dom";
import Button from "@mui/material/Button";

export function Layout() {
  return <Container maxWidth={false}>
    <Box sx={{display: "flex", justifyContent: "center", gap: 2}}>
      <Button component={Link} to={"/behaviors"}>Track</Button>
      <Button component={Link} to={"/behaviors/analyze"}>Analyze</Button>
    </Box>
    <Outlet />
  </Container>
}