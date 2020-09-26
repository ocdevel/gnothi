import Privacy from "./Privacy";
import Terms from "./Terms";
import {Route} from "react-router-dom";
import React from "react";

export default function staticRoutes() {
  return [
     <Route path="/privacy"><Privacy /></Route>,
     <Route path="/terms"><Terms /></Route>
  ]
}
