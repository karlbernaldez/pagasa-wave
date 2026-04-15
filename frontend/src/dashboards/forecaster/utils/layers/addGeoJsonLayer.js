export function addGeoJsonLayer(map, file, layers, setLayers) {
    const reader = new FileReader();

    reader.onload = (e) => {
        let geojson;
        try {
            geojson = JSON.parse(e.target.result);
        } catch (err) {
            console.error('Invalid JSON:', err);
            return;
        }

        const timestamp  = Date.now();
        const sourceId   = `geojson-source-${timestamp}`;
        const fillLayerId = `geojson-fill-${timestamp}`;
        const lineLayerId = `geojson-line-${timestamp}`;

        map.addSource(sourceId, { type: 'geojson', data: geojson });

        map.addLayer({
            id: fillLayerId, type: 'fill', source: sourceId, slot: 'bottom',
            paint: { 'fill-color': '#0080ff', 'fill-opacity': 0.2 },
        });

        map.addLayer({
            id: lineLayerId, type: 'line', source: sourceId, slot: 'bottom',
            paint: { 'line-color': '#000', 'line-width': 2 },
        });

        const baseName      = file.name.replace(/\.[^/.]+$/, '') || 'Layer';
        const existingNames = layers.map((l) => l.name);
        let counter = 1;
        let uniqueName = baseName;
        while (existingNames.includes(uniqueName)) uniqueName = `${baseName} ${counter++}`;

        setLayers((prev) => [
            ...prev,
            { id: sourceId, name: uniqueName, visible: true, locked: false, fillId: fillLayerId, lineId: lineLayerId },
        ]);
    };

    reader.readAsText(file);
}