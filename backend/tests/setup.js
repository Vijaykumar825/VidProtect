/**
 * Test Setup Configuration
 * Configures in-memory MongoDB for testing
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to the in-memory database
 */
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

/**
 * Drop database, close the connection and stop mongod
 */
const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * Remove all data from all collections
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Create a test user
 * @param {Object} overrides - Properties to override
 * @returns {Object} Created user
 */
const createTestUser = async (overrides = {}) => {
  const User = require('../models/User');

  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'editor',
    ...overrides
  };

  return await User.create(defaultUser);
};

/**
 * Generate test JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  connectDB,
  closeDB,
  clearDB,
  createTestUser,
  generateTestToken
};
