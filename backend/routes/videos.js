const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { analyzeVideo, getEstimatedProcessingTime } = require('../services/sensitivityAnalysis');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for video types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // Default 100MB
  }
});

// @desc    Upload a video
// @route   POST /api/videos/upload
// @access  Private (Editor, Admin)
router.post('/upload', protect, authorize('editor', 'admin'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const { title, description } = req.body;

    if (!title) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please provide a title for the video'
      });
    }

    // Create video document
    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      owner: req.user._id,
      status: 'uploading',
      processingProgress: 0
    });

    // Emit upload progress (100% since file is uploaded)
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('upload:progress', {
      videoId: video._id,
      progress: 100
    });

    // Update status and start processing
    await Video.findByIdAndUpdate(video._id, { status: 'processing' });

    // Start sensitivity analysis in background
    const filePath = path.join(uploadsDir, req.file.filename);
    analyzeVideo(video._id.toString(), filePath, io, req.user._id.toString())
      .catch(err => console.error('Background processing error:', err));

    // Calculate estimated processing time
    const estimatedTime = getEstimatedProcessingTime(req.file.size);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: {
        video: {
          id: video._id,
          title: video.title,
          status: 'processing',
          estimatedProcessingTime: estimatedTime
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading video'
    });
  }
});

// @desc    Get all videos for current user
// @route   GET /api/videos
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, classification, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Build query
    const query = {};

    // Users can only see their own videos (unless admin)
    if (req.user.role !== 'admin') {
      query.owner = req.user._id;
    }

    // Filter by status
    if (status && ['uploading', 'processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    // Filter by classification
    if (classification && ['safe', 'flagged', 'pending'].includes(classification)) {
      query['sensitivityResult.classification'] = classification;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get videos with pagination
    const videos = await Video.find(query)
      .populate('owner', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos'
    });
  }
});

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Private (Owner or Admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('owner', 'username email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && video.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this video'
      });
    }

    res.json({
      success: true,
      data: { video }
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video'
    });
  }
});

// @desc    Stream video
// @route   GET /api/videos/:id/stream
// @access  Private (Owner, Viewer, or Admin)
router.get('/:id/stream', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access (owner or admin, or viewer with permission)
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user._id.toString()) {
      // Viewers can access if explicitly shared (future feature)
      if (req.user.role === 'viewer') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to stream this video'
        });
      }
    }

    const filePath = path.join(uploadsDir, video.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimetype
      });

      file.pipe(res);
    } else {
      // No range request, send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video'
    });
  }
});

// @desc    Update video details
// @route   PUT /api/videos/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, authorize('editor', 'admin'), async (req, res) => {
  try {
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this video'
      });
    }

    const { title, description } = req.body;

    video = await Video.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video }
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video'
    });
  }
});

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, authorize('editor', 'admin'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete file from disk
    const filePath = path.join(uploadsDir, video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete thumbnail if exists
    if (video.thumbnail) {
      const thumbPath = path.join(uploadsDir, video.thumbnail);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video'
    });
  }
});

// @desc    Get video statistics (for dashboard)
// @route   GET /api/videos/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };

    const [stats] = await Video.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalSize: { $sum: '$size' },
          safeVideos: {
            $sum: { $cond: [{ $eq: ['$sensitivityResult.classification', 'safe'] }, 1, 0] }
          },
          flaggedVideos: {
            $sum: { $cond: [{ $eq: ['$sensitivityResult.classification', 'flagged'] }, 1, 0] }
          },
          processingVideos: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats || {
          totalVideos: 0,
          totalSize: 0,
          safeVideos: 0,
          flaggedVideos: 0,
          processingVideos: 0
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;
