import {useStore} from "../../../data/store";
import React, {useCallback, useState} from "react";
import {Sortable} from "../../Components/Sortable";
import Form from './Form'
import {Tags} from '@gnothi/schemas/tags'
import {tags_list_response} from "../../../../../schemas/tags.ts";
import produce from "immer";


export function TagsList() {
  const send = useStore(useCallback(s => s.send, []))
  const tags = useStore(s => s.res.tags_list_response?.rows || [])

  const onReorder = useCallback((newOrder: tags_list_response[]) => {
    useStore.setState(produce(s => {
      // update the UI first so we don't get a flicker
      s.res.tags_list_response.rows = newOrder
    }))
    send("tags_sort_request", newOrder.map((f, i) => ({id: f.id, sort: i})))
  }, [])

  const renderTag = useCallback((tag: Tags.tags_list_response) => (
    <Form tag={tag} />
  ), [])

  return (
    <Sortable
      items={tags}
      render={renderTag}
      onReorder={onReorder}
      sortableId={`sortable-tags`}
    />
  )
}