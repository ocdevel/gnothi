import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import {Outlet} from "react-router-dom";

export default function Layout() {
  return (
    // <Container>
    //   <Box sx={{p: 3}}>
        <Outlet />
      // </Box>
    // </Container>
  )
}
