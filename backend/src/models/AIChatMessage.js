import mongoose from 'mongoose';

const aiChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      default: 'default_session',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    contextSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    emergencyAlert: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

aiChatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: 1 });

const AIChatMessage = mongoose.model('AIChatMessage', aiChatMessageSchema);
export default AIChatMessage;
