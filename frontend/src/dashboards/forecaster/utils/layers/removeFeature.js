import { deleteFeature } from '@/api/featureServices';

export async function removeFeature(draw, layerID) {
    if (draw?.delete) {
        draw.trash();
        draw.delete(layerID);
    }

    const cleanedID = typeof layerID === 'string' && layerID.endsWith('_dash')
        ? layerID.slice(0, -5)
        : layerID;

    try {
        const token = localStorage.getItem('authToken');
        await deleteFeature(cleanedID ?? layerID, token);
    } catch (err) {
        console.error(`Failed to delete feature "${layerID}" from backend.`, err);
    }
}