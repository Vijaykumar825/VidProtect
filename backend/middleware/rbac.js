// Role-based access control middleware

// Check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is the owner of the resource or is admin
exports.isOwnerOrAdmin = (resourceOwnerField = 'owner') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership in the resource (set by previous middleware)
    if (req.resource && req.resource[resourceOwnerField]) {
      const ownerId = req.resource[resourceOwnerField].toString();
      const userId = req.user._id.toString();

      if (ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }
    }

    next();
  };
};

// Permission matrix for different roles
const permissions = {
  viewer: ['read:own_videos', 'stream:own_videos'],
  editor: ['read:own_videos', 'stream:own_videos', 'upload:videos', 'delete:own_videos', 'update:own_videos'],
  admin: ['read:all_videos', 'stream:all_videos', 'upload:videos', 'delete:all_videos', 'update:all_videos', 'manage:users']
};

// Check if user has specific permission
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = exports;
