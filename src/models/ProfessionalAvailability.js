import mongoose from 'mongoose';

const ScheduleDaySchema = new mongoose.Schema({
  available: { type: Boolean, default: true },
  start: { type: String, default: "09:00" },
  end: { type: String, default: "18:00" },
  breaks: [{ start: String, end: String }]
}, { _id: false });

const WeeklyScheduleSchema = new mongoose.Schema({
  mon: { type: ScheduleDaySchema, default: () => ({}) },
  tue: { type: ScheduleDaySchema, default: () => ({}) },
  wed: { type: ScheduleDaySchema, default: () => ({}) },
  thu: { type: ScheduleDaySchema, default: () => ({}) },
  fri: { type: ScheduleDaySchema, default: () => ({}) },
  sat: { type: ScheduleDaySchema, default: () => ({}) },
  sun: { type: ScheduleDaySchema, default: () => ({}) },
}, { _id: false });

const ProfessionalAvailabilitySchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, unique: true, index: true },
  weeklySchedule: { type: WeeklyScheduleSchema, default: () => ({}) },
  blockedDates: [{ type: Date }],
  dateOverrides: [{
    date: Date,
    available: Boolean,
    start: String,
    end: String,
  }],
}, { timestamps: true });

export default mongoose.models.ProfessionalAvailability || mongoose.model('ProfessionalAvailability', ProfessionalAvailabilitySchema);
