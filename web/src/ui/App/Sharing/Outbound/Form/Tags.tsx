import React, {useCallback} from "react";
import Tags from "../../../Tags/Tags";
import {useStore} from "../../../../../data/store";
import {useShallow} from "zustand/react/shallow";

export default function FormTags() {
  const [
    tags
  ] = useStore(useShallow(s => [
    s.sharing.form.tags
  ]))
  const [
    setTags
  ] = useStore(useCallback(s => [
    s.sharing.form.setTags
  ], []))
  return <Tags
    selected={tags}
    setSelected={setTags}
  />
}