import Layer from '../models/Layer.js';

export const getLayers = async (req, res) => {
    const layers = await Layer.find().sort({ createdAt: 1 });
    res.json(layers);
};

export const addLayer = async (req, res) => {
    try {
        const newLayer = new Layer(req.body);
        const saved = await newLayer.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const updateLayer = async (req, res) => {
    try {
        const updated = await Layer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Layer not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteLayer = async (req, res) => {
    try {
        await Layer.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
