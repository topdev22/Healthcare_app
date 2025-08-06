import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  lastMessageAt: Date;
  messageCount: number;
  tags?: string[];
  metadata?: {
    userMood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
    topics?: string[];
    healthContext?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: function() {
      return `Conversation ${new Date().toLocaleDateString()}`;
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  lastMessageAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    userMood: {
      type: String,
      enum: ['happy', 'neutral', 'sad', 'excited', 'anxious']
    },
    topics: [{
      type: String,
      trim: true
    }],
    healthContext: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, tags: 1 });

// Pre-save middleware to update title based on first message
conversationSchema.pre('save', function(next) {
  if (this.isNew && !this.title) {
    this.title = `Conversation ${new Date().toLocaleDateString()}`;
  }
  next();
});

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;