import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'image' | 'health_data' | 'suggestion' | 'system_notification';
  
  // AI Response specific fields
  aiResponse?: {
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' | 'sleeping';
    confidence: number;
    responseTime: number;
    model?: string;
    tokens?: number;
  };

  // Message metadata
  metadata?: {
    healthContext?: any;
    userMood?: string;
    topics?: string[];
    intent?: string;
    entities?: any[];
    sentiment?: 'positive' | 'negative' | 'neutral';
  };

  // Message status and handling
  status: 'sent' | 'delivered' | 'read' | 'failed';
  editedAt?: Date;
  deletedAt?: Date;
  
  // Attachments and rich content
  attachments?: {
    type: 'image' | 'file' | 'health_log' | 'food_photo';
    url?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    healthData?: any;
  }[];

  // Analytics and feedback
  userFeedback?: {
    helpful: boolean;
    rating?: number;
    comment?: string;
    feedbackAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'health_data', 'suggestion', 'system_notification'],
    default: 'text',
    index: true
  },
  aiResponse: {
    mood: {
      type: String,
      enum: ['happy', 'neutral', 'sad', 'excited', 'anxious', 'sleeping']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    responseTime: {
      type: Number,
      min: 0
    },
    model: {
      type: String,
      trim: true
    },
    tokens: {
      type: Number,
      min: 0
    }
  },
  metadata: {
    healthContext: {
      type: Schema.Types.Mixed,
      default: {}
    },
    userMood: {
      type: String,
      trim: true
    },
    topics: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    intent: {
      type: String,
      trim: true
    },
    entities: [{
      type: Schema.Types.Mixed
    }],
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'health_log', 'food_photo'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    mimeType: {
      type: String,
      trim: true
    },
    healthData: {
      type: Schema.Types.Mixed
    }
  }],
  userFeedback: {
    helpful: {
      type: Boolean
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    feedbackAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ conversationId: 1, sender: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, type: 1, createdAt: -1 });
chatMessageSchema.index({ 'metadata.topics': 1 });
chatMessageSchema.index({ status: 1, createdAt: -1 });

// Text search index for message content
chatMessageSchema.index({ content: 'text' });

// Soft delete - don't return deleted messages by default
chatMessageSchema.pre(/^find/, function() {
  // Only apply filter if deletedAt is not explicitly queried
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: { $exists: false } });
  }
});

// Update conversation's lastMessageAt and messageCount when a message is saved
chatMessageSchema.post('save', async function(doc) {
  if (doc.sender !== 'system') {
    await mongoose.model('Conversation').findByIdAndUpdate(
      doc.conversationId,
      {
        lastMessageAt: doc.createdAt,
        $inc: { messageCount: 1 }
      }
    );
  }
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;