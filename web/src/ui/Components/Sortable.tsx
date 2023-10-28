/**
 * https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/about/examples.md
 * https://codesandbox.io/s/zqwz5n5p9x?file=/src/index.js
 */
import React, { useState, useMemo } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Turns out react-beautiful-dnd was abandoned & doesn't work with React 18+, this fork is drop-in replacement
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

interface Item<T> {
  item: T
  index: number
  keyby: string
  render: (item: T) => React.ReactNode
}
function Item<T>({item, index, keyby, render}: Item<T>) {
  return (
    <Draggable draggableId={item[keyby]} index={index}>
      {provided => (
        // TODO use component provided from caller, see codesandbox
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {render(item)}
        </div>
      )}
    </Draggable>
  );
}

interface List<T> {
  items: T[]
  render: (item: T) => React.ReactNode
  keyby: string
}
const List = React.memo(function List<T>({items, render, keyby}: List<T>) {
  return items.map((item, index) => <Item
    item={item}
    index={index}
    key={item[keyby]}
    keyby={keyby}
    render={render}
  />);
});

interface Sortable<T> {
  items: T[]
  onReorder: (items: T[]) => T[]
  render: (item: T) => React.ReactNode
  keyby?: string
  droppableId?: string
}
export function Sortable<T>({items, onReorder, render, keyby='id', droppableId="list"}: Sortable<T>) {
  function onDragEnd(result) {
    if (!result.destination) { return }
    if (result.destination.index === result.source.index) { return }
    onReorder(reorder(
      items,
      result.source.index,
      result.destination.index
    ))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd} >
      <Droppable droppableId={droppableId} >
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <List items={items} render={render} keyby={keyby} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
