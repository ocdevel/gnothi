import React, {useState} from "react";
import TopBooks from "./TopBooks";
import Links from "./Links";
import {NestedList, ListItem} from '../Utils'

export function Misc() {
  const [showTopBooks, setShowTopBooks] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  function toggleBooks() {
    setShowTopBooks(!showTopBooks)
  }
  function toggleLinks() {
    setShowLinks(!showLinks)
  }

  return <>
    {showTopBooks && <TopBooks close={toggleBooks} />}
    {showLinks && <Links close={toggleLinks} />}

    <NestedList primary='Misc' startOpen={false}>
      <ListItem onClick={toggleBooks} primary='Top Books' nested={true} />
      <ListItem onClick={toggleLinks} primary='Links' nested={true} />
    </NestedList>
  </>
}
