import Guide from '../models/Guide.js';

// Create a new guide
export const createGuide = async (req, res) => {
  try {
    const guide = new Guide(req.body);
    await guide.save();
    res.status(201).json(guide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all guides
export const getGuides = async (req, res) => {
  try {
    const guides = await Guide.find();
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single guide by ID
export const getGuideById = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a guide
export const updateGuide = async (req, res) => {
  try {
    const guide = await Guide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json(guide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a guide
export const deleteGuide = async (req, res) => {
  try {
    const guide = await Guide.findByIdAndDelete(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
