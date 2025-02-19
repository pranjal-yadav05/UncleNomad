import Property from '../models/Property.js';

// Get property details
export const getProperty = async (req, res) => {
  try {
    const property = await Property.findOne();
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update property details
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true
    });
    res.json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
