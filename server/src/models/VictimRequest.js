import mongoose from 'mongoose';

const VolunteerResponseSchema = new mongoose.Schema(
  {
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    etaMinutes: { type: Number },
  },
  { timestamps: true, _id: false }
);

const VictimRequestSchema = new mongoose.Schema(
  {
    victim: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
      },
    },
    weather: {
      type: Object,
      default: null,
    },
    disasterType: {
      type: String,
      enum: ['Earthquake', 'Fire', 'Tsunami', 'Flood', 'Cyclone', 'Landslide', 'Pandemic', 'Other'],
      required: true,
    },
    resourcesNeeded: [{ type: String }],
    description: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed'], default: 'pending' },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    etaMinutes: { type: Number },
    precautions: [{ type: String }],
    responses: [VolunteerResponseSchema],
    review: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      at: { type: Date }
    },
  },
  { timestamps: true }
);

export default mongoose.model('VictimRequest', VictimRequestSchema);
