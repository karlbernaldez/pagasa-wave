import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";


// ─────────────────────────────────────────────────────────────
// Sortable Item
// ─────────────────────────────────────────────────────────────
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    zIndex: isDragging ? 40 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-200 ${
        isDragging ? "scale-[1.02] shadow-2xl" : ""
      }`}
    >
      {children({
        dragHandleProps: {
          ref: setActivatorNodeRef,
          ...listeners,
          ...attributes,
        },
        listeners,
        attributes,
        isDragging,
      })}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// MAIN SORTABLE DND
// ─────────────────────────────────────────────────────────────
export function SortableDnD({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  strategy = "list",
  className = "",
}) {

  // Sensors: pointer + keyboard accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState(null);

  const ids = items.map((i) => i.id);
  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}

      onDragStart={(e) => {
        setActiveId(e.active.id);
      }}

      onDragCancel={() => setActiveId(null)}

      onDragEnd={(e) => {
        const { active, over } = e;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = ids.indexOf(active.id);
        const newIndex = ids.indexOf(over.id);

        if (oldIndex !== newIndex) {
          onReorder(arrayMove(items, oldIndex, newIndex));
        }
      }}
    >
      <SortableContext
        items={ids}
        strategy={
          strategy === "grid"
            ? rectSortingStrategy
            : verticalListSortingStrategy
        }
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(sortableProps) =>
                renderItem(item, sortableProps)
              }
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      {/* DRAG OVERLAY */}
      <DragOverlay
        dropAnimation={{
          duration: 180,
          easing: "cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {activeItem && renderOverlay ? (
          <div className="pointer-events-none">
            {renderOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}