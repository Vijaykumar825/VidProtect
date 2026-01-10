/**
 * User Controller
 * Handles user management operations (admin functions)
 */

const User = require('../models/User');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
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
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's video count
    const videoCount = await Video.countDocuments({ owner: user._id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          videoCount
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
};

/**
 * @desc    Update user role
 * @route   PUT /api/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ['viewer', 'editor', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (viewer, editor, admin)'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-demotion from admin
    if (req.user.id === req.params.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote yourself from admin'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete user's videos
    const videos = await Video.find({ owner: user._id });

    for (const video of videos) {
      const filePath = path.join(__dirname, '..', 'uploads', video.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Video.deleteMany({ owner: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User and associated videos deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats/summary
 * @access  Private (Admin only)
 */
const getUserStats = async (req, res) => {
  try {
    const [total, viewers, editors, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'viewer' }),
      User.countDocuments({ role: 'editor' }),
      User.countDocuments({ role: 'admin' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byRole: {
          viewers,
          editors,
          admins
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getUserStats
};
