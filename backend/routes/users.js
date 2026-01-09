const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All routes require admin role
router.use(protect, authorize('admin'));

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};

    // Filter by role
    if (role && ['viewer', 'editor', 'admin'].includes(role)) {
      query.role = role;
    }

    // Search by username or email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get video counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ owner: user._id });
        return {
          ...user.toObject(),
          videoCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's video statistics
    const [stats] = await Video.aggregate([
      { $match: { owner: user._id } },
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
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          stats: stats || { totalVideos: 0, totalSize: 0, safeVideos: 0, flaggedVideos: 0 }
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (viewer, editor, admin)'
      });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Option: Delete all user's videos or reassign them
    // For now, we'll just delete the user and leave videos orphaned
    // In production, you might want to handle this differently

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @desc    Get system statistics
// @route   GET /api/users/stats/system
// @access  Private (Admin only)
router.get('/stats/system', async (req, res) => {
  try {
    const [userStats] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          viewers: { $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] } },
          editors: { $sum: { $cond: [{ $eq: ['$role', 'editor'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
        }
      }
    ]);

    const [videoStats] = await Video.aggregate([
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
        users: userStats || { totalUsers: 0, viewers: 0, editors: 0, admins: 0 },
        videos: videoStats || { totalVideos: 0, totalSize: 0, safeVideos: 0, flaggedVideos: 0, processingVideos: 0 }
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics'
    });
  }
});

module.exports = router;
