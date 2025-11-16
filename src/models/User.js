// /models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }, // hide by default
  role: {
    type: String,
    enum: ["student", "admin", "lead"],
    default: "student"
  },
  managesClub: { type: Schema.Types.ObjectId, ref: "Club", default: null },
  avatarUrl: { type: String, default: null }, // optional (for Google)
}, {
  timestamps: true
});

// Hash password before save if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Prevent model overwrite upon hot reloads in dev
export default mongoose.models.User || mongoose.model("User", userSchema);
