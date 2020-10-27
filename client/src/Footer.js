import {Link} from "react-router-dom";
import React from "react";

export default function Footer () {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <div id='footer'>
    <Link to='/about'>About</Link>{' '}&#183;{' '}
    <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
    <Link to='/privacy'>Privacy</Link>{' '}&#183;{' '}
    <Link to='/terms'>Terms</Link>{' '}
  </div>
}
