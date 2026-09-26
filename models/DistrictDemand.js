import mongoose from 'mongoose';

const districtDemandSchema = new mongoose.Schema({
  districtName: { type: String, required: true, unique: true },
  state: { type: String, required: true },
  odopProduct: { type: String, required: true },
  odopSector: { type: String, required: true },
  activeMsmeUnits: { type: Number, default: 0 },
  monthlyVacancies: { type: Number, default: 0 },
  topSkillsNeeded: [{ type: String }],
  giaBudgetSanctionedInLakhs: { type: Number, default: 50 },
  skillingBudgetInLakhs: { type: Number, default: 5 }
});

const DistrictDemand = mongoose.model('DistrictDemand', districtDemandSchema);
export default DistrictDemand;
