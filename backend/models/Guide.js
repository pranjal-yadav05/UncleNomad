import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  speciality: { type: String, required: true },
  experience: { type: String, required: true },
  image: { type: String, required: true },
  languages: [{ type: String }]
});

const Guide = mongoose.model('Guide', guideSchema);

export default Guide;
