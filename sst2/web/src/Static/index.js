import Privacy from "./Privacy";
import Terms from "./Terms";
import {Route} from "react-router-dom";
import React from "react";

export default function staticRoutes() {
  return [
     <Route path="/privacy" key={'privacy'}><Privacy /></Route>,
     <Route path="/terms" key={'terms'}><Terms /></Route>
  ]
}
