/**
 * Video Controller
 * Handles video upload, retrieval, streaming, and management
 */

const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const { analyzeVideo } = require('../services/sensitivityAnalysis');

/**
 * Get estimated processing time based on file size
 * @param {number} fileSize - File size in bytes
 * @returns {string} Estimated time string
 */
const getEstimatedProcessingTime = (fileSize) => {
  const sizeMB = fileSize / (1024 * 1024);
  if (sizeMB < 10) return '30 seconds';
  if (sizeMB < 50) return '1-2 minutes';
  return '3-5 minutes';
};

/**
 * @desc    Upload a new video
 * @route   POST /api/videos/upload
 * @access  Private (Editor, Admin)
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const { title, description } = req.body;

    if (!title) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Please provide a title'
      });
    }

    // Create video document
    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      owner: req.user.id,
      status: 'processing'
    });

    // Get socket.io instance
    const io = req.app.get('io');

    // Start background processing
    analyzeVideo(video, io)
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
};

/**
 * @desc    Get all videos for current user
 * @route   GET /api/videos
 * @access  Private
 */
const getVideos = async (req, res) => {
  try {
    const { status, classification, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Build query
    const query = {};

    // Users can only see their own videos (unless admin)
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }

    // Apply filters
    if (status) query.status = status;
    if (classification) query.classification = classification;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'username email');

    const total = await Video.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
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
};

/**
 * @desc    Get single video
 * @route   GET /api/videos/:id
 * @access  Private (Owner or Admin)
 */
const getVideo = async (req, res) => {
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
    if (req.user.role !== 'admin' && video.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this video'
      });
    }

    res.status(200).json({
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
};

/**
 * @desc    Stream video with range request support
 * @route   GET /api/videos/:id/stream
 * @access  Private (Owner, Viewer, or Admin)
 */
const streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this video'
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', video.filename);

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
};

/**
 * @desc    Update video details
 * @route   PUT /api/videos/:id
 * @access  Private (Owner or Admin)
 */
const updateVideo = async (req, res) => {
  try {
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user.id) {
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

    res.status(200).json({
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
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private (Owner or Admin)
 */
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && video.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '..', 'uploads', video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
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
};

/**
 * @desc    Get video statistics
 * @route   GET /api/videos/stats/summary
 * @access  Private
 */
const getVideoStats = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user.id };

    const [total, processing, safe, flagged] = await Promise.all([
      Video.countDocuments(query),
      Video.countDocuments({ ...query, status: 'processing' }),
      Video.countDocuments({ ...query, classification: 'safe' }),
      Video.countDocuments({ ...query, classification: 'flagged' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        processing,
        safe,
        flagged
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  updateVideo,
  deleteVideo,
  getVideoStats,
  getEstimatedProcessingTime
};
