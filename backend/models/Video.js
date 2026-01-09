const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading'
  },
  sensitivityResult: {
    classification: {
      type: String,
      enum: ['safe', 'flagged', 'pending'],
      default: 'pending'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    analyzedAt: {
      type: Date
    },
    flags: [{
      type: String
    }]
  },
  processingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  streamable: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ status: 1 });
videoSchema.index({ 'sensitivityResult.classification': 1 });

module.exports = mongoose.model('Video', videoSchema);
