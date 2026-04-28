export const handleDragStart = (event, index, setDragging, setDraggedLayerIndex) => {
    setDragging(true);
    setDraggedLayerIndex(index);
    event.dataTransfer.setData('text/plain', '');
};

export const handleDragOver = (event) => {
    event.preventDefault();
};

export const handleDrop = (event, index, draggedLayerIndex, layers, setLayers, setDragging) => {
    event.preventDefault();
    setDragging(false);

    if (draggedLayerIndex === null || draggedLayerIndex === index) return;

    const updated = [...layers];
    const [dragged] = updated.splice(draggedLayerIndex, 1);
    updated.splice(index, 0, dragged);
    setLayers(updated);
};