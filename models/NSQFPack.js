import mongoose from 'mongoose';

const nsqfPackSchema = new mongoose.Schema({
  qpCode: { type: String, required: true, unique: true },
  roleName: { type: String, required: true },
  nsqfLevel: { type: Number, required: true },
  sector: { type: String, required: true },
  durationHours: { type: Number, default: 300 },
  courseType: { type: String, default: 'Short Term Course' },
  keywords: [{ type: String }]
});

const NSQFPack = mongoose.model('NSQFPack', nsqfPackSchema);
export default NSQFPack;
