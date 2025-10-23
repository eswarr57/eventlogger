import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String
  },
  place: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'success', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Virtual for formatted date
eventSchema.virtual('displayDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Event', eventSchema);