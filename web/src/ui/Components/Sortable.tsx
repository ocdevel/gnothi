import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";



const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

function Item({item, index, keyBy, render}) {
  return (
    <Draggable draggableId={item[keyBy]} index={index}>
      {provided => (
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

const List = React.memo(function List({items, render, keyBy}) {
  return items.map((item, index) => <Item
    item={item}
    index={index}
    key={item[keyBy]}
    keyBy={keyBy}
    render={render}
  />);
});

export default function Sortable({items, onReorder, render, keyBy='id'}) {
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
      <Droppable droppableId="list" >
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <List items={items} render={render} keyBy={keyBy} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
