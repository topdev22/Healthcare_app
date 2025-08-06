import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  displayName: string;
  photoURL?: string;
  provider: 'email' | 'google';
  googleId?: string;
  isEmailVerified: boolean;
  // Extended profile fields
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthGoals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: function(this: IUser) {
      return this.provider === 'email';
    },
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  photoURL: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    required: true,
    default: 'email'
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Extended profile fields
  age: {
    type: Number,
    min: 1,
    max: 120
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  height: {
    type: Number,
    min: 50,
    max: 300
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
  },
  healthGoals: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ provider: 1 });

export const User = mongoose.model<IUser>('User', userSchema);