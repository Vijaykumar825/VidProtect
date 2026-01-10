/**
 * Video Tests
 * Tests for video upload, retrieval, and management operations
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../server');
const { connectDB, closeDB, clearDB, createTestUser, generateTestToken } = require('./setup');
const Video = require('../models/Video');

describe('Video Endpoints', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });

  describe('GET /api/videos', () => {
    it('should return empty array when no videos', async () => {
      const res = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.videos).toEqual([]);
      expect(res.body.data.pagination.total).toBe(0);
    });

    it('should return user videos', async () => {
      // Create test video
      await Video.create({
        title: 'Test Video',
        description: 'Test description',
        filename: 'test.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: testUser._id,
        status: 'completed',
        classification: 'safe'
      });

      const res = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.videos.length).toBe(1);
      expect(res.body.data.videos[0].title).toBe('Test Video');
    });

    it('should not return other users videos', async () => {
      const otherUser = await createTestUser({
        username: 'other',
        email: 'other@example.com'
      });

      await Video.create({
        title: 'Other User Video',
        filename: 'other.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: otherUser._id,
        status: 'completed'
      });

      const res = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.videos.length).toBe(0);
    });

    it('should filter videos by status', async () => {
      await Video.create([
        {
          title: 'Processing Video',
          filename: 'proc.mp4',
          mimetype: 'video/mp4',
          size: 1000000,
          owner: testUser._id,
          status: 'processing'
        },
        {
          title: 'Completed Video',
          filename: 'done.mp4',
          mimetype: 'video/mp4',
          size: 1000000,
          owner: testUser._id,
          status: 'completed'
        }
      ]);

      const res = await request(app)
        .get('/api/videos?status=completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.videos.length).toBe(1);
      expect(res.body.data.videos[0].title).toBe('Completed Video');
    });

    it('should not access without authentication', async () => {
      const res = await request(app)
        .get('/api/videos');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return video details', async () => {
      const video = await Video.create({
        title: 'Detail Test',
        description: 'Details here',
        filename: 'detail.mp4',
        mimetype: 'video/mp4',
        size: 5000000,
        owner: testUser._id,
        status: 'completed',
        classification: 'safe'
      });

      const res = await request(app)
        .get(`/api/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.video.title).toBe('Detail Test');
      expect(res.body.data.video.description).toBe('Details here');
    });

    it('should return 404 for non-existent video', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/videos/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should not return other user video', async () => {
      const otherUser = await createTestUser({
        username: 'other2',
        email: 'other2@example.com'
      });

      const video = await Video.create({
        title: 'Other Video',
        filename: 'other.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: otherUser._id,
        status: 'completed'
      });

      const res = await request(app)
        .get(`/api/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/videos/:id', () => {
    it('should delete user video', async () => {
      const video = await Video.create({
        title: 'To Delete',
        filename: 'delete.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: testUser._id,
        status: 'completed'
      });

      const res = await request(app)
        .delete(`/api/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deleted
      const deleted = await Video.findById(video._id);
      expect(deleted).toBeNull();
    });

    it('should not delete other user video', async () => {
      const otherUser = await createTestUser({
        username: 'other3',
        email: 'other3@example.com'
      });

      const video = await Video.create({
        title: 'Not Mine',
        filename: 'notmine.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: otherUser._id,
        status: 'completed'
      });

      const res = await request(app)
        .delete(`/api/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);

      // Verify not deleted
      const stillExists = await Video.findById(video._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('PUT /api/videos/:id', () => {
    it('should update video metadata', async () => {
      const video = await Video.create({
        title: 'Original Title',
        description: 'Original',
        filename: 'update.mp4',
        mimetype: 'video/mp4',
        size: 1000000,
        owner: testUser._id,
        status: 'completed'
      });

      const res = await request(app)
        .put(`/api/videos/${video._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.video.title).toBe('Updated Title');
    });
  });
});
