import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['victim', 'volunteer'], required: true },
    phone: { type: String },
    location: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
