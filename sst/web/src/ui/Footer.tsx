import {Link} from "react-router-dom";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from '@mui/material/Container';
import { Static } from "./Static/Routes";
import { padding } from "@mui/system";



export default function Footer () {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <Container maxWidth={false}> 
    <Box sx={{ alignItems: 'center', justifyContent: 'space-around', position: 'static', my: 3, mx: 3, flexGrow: 1, display: "flex" }}> 
     <Typography 
    component='footer' 
    variant='body2'
    >
      <Box sx= {{display: 'flex', my: 2, flexGrow: 1}}> 
        <Box>
        <Link to='/about'>About</Link>{' '}&#183;{' '}
        <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
        <Link to='/privacy'>Privacy</Link>{' '}&#183;{' '}
        <Link to='/terms'>Terms</Link>
        </Box>
      </Box>

      <Box sx= {{display: 'flex', justifyContent: 'center'}}> 
        <Box>© 2020 OCDevel LLC</Box>
        </Box>
  
  </Typography>
  </Box>
</Container>
}
