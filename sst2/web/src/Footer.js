import {Link} from "react-router-dom";
import React from "react";
import Stack from "@material-ui/core/Stack";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

export default function Footer () {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <Typography component='footer' variant='body2'>
    <Stack direction='column' align='center' spacing={1} mb={1}>
      <div>
        <Link to='/about'>About</Link>{' '}&#183;{' '}
        <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
        <Link to='/privacy'>Privacy</Link>{' '}&#183;{' '}
        <Link to='/terms'>Terms</Link>
      </div>
      <div>Copyright © 2020 OCDevel LLC</div>
    </Stack>
  </Typography>
}
