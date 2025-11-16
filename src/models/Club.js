import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  colead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  galleryImages: [{
    url: String,
    public_id: String
  }],
  hiringStatus: {
    type: Boolean,
    default: false
  },
  hiringDescription: {
    type: String,
    default: ''
  },
    recruitmentFormUrl: {
      type: String,
      default: ''
    },
    recruitmentWindow: {
      start: { type: Date, default: null },
      end: { type: Date, default: null }
    },
    announcements: [
      {
        title: { type: String, required: true },
        body: { type: String, required: true },
        link: { type: String, default: '' },
        expiresAt: { type: Date, default: null }
      }
    ]
}, { timestamps: true });

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
