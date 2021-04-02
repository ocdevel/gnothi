import React, {useEffect, useState} from "react";
import Fields from "../Fields/Fields";
import {
  Card,
} from "react-bootstrap";

export default function Sidebar() {
  return <>
      <Card>
        <Card.Header>Fields</Card.Header>
        <Card.Body>
          <Fields />
        </Card.Body>
      </Card>
    {/* <Ads /> */}
  </>
}
