import mongoose from "mongoose";

const schema = mongoose.Schema;

const JoinReqSchema = new schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

JoinReqSchema.index({ user: 1, club: 1 }, { unique: true });

export default mongoose.models.JoinReq || mongoose.model('JoinReq', JoinReqSchema);
