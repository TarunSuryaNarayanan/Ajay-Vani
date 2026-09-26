import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema({
  name: { type: String, default: 'Beneficiary (Voice Recorded)' },
  phone: { type: String, default: '' },
  district: { type: String, required: true },
  state: { type: String, required: true },
  language: { type: String, default: 'hi-IN' },
  dialect: { type: String, default: 'Hindi / Regional' },
  transcript: { type: String, required: true },
  extractedProfile: {
    educationLevel: { type: String, default: 'Unspecified' },
    traditionalOccupation: { type: String, default: 'General Work' },
    currentSkillSet: [{ type: String }],
    physicalMobility: { type: String, default: 'Local District' },
    employmentPreference: { type: String, default: 'Self-Employment' },
    financialAidNeeded: { type: Boolean, default: true }
  },
  recommendedNSQF: {
    qpCode: { type: String, default: 'AGR/Q6701' },
    roleName: { type: String, default: 'Solar Pump Technician' },
    nsqfLevel: { type: Number, default: 4 },
    sector: { type: String, default: 'Agriculture & Green Energy' },
    matchScore: { type: Number, default: 90 }
  },
  localMarketDemand: {
    odopSector: { type: String, default: 'Solar & Renewable Energy' },
    estimatedLocalVacancies: { type: Number, default: 120 },
    feasibilityScore: { type: Number, default: 88 }
  },
  placementStatus: { 
    type: String, 
    enum: ['Voice Onboarded', 'NSQF Skilled', 'GIA Subsidy Disbursed', 'Verified Job Placed'],
    default: 'Voice Onboarded' 
  },
  syncStatus: { type: String, enum: ['online', 'offline_synced'], default: 'online' },
  createdAt: { type: Date, default: Date.now }
});

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
export default Beneficiary;
