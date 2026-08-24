import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { connectTestDB, disconnectTestDB } from './helpers';

describe('Admin Endpoints (/admin/stats, /admin/users)', () => {
  const ts = Date.now();
  const adminUser = {
    username: 'admin_test',
    email: `admin_${ts}@test.com`,
    password: 'Password123!',
    role: 'admin',
  };

  const normalUser = {
    username: 'normal_test',
    email: `normal_${ts}@test.com`,
    password: 'Password123!',
  };

  let adminToken: string;
  let userToken: string;
  let normalUserId: string;

  beforeAll(async () => {
    await connectTestDB();

    await request(app).post('/auth/register').send(adminUser);
    await User.updateOne({ email: adminUser.email }, { role: 'admin' });

    const adminLogin = await request(app).post('/auth/login').send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.token;

    await request(app).post('/auth/register').send(normalUser);
    const userLogin = await request(app).post('/auth/login').send({ email: normalUser.email, password: normalUser.password });
    userToken = userLogin.body.token;
    normalUserId = userLogin.body.userId;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [adminUser.email, normalUser.email] } });
    await disconnectTestDB();
  });

  describe('GET /admin/stats', () => {
    it('should return 403 Forbidden for non-admin user', async () => {
      const res = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Admin rights required');
    });

    it('should return system stats for admin user', async () => {
      const res = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalTasks');
    });
  });

  describe('GET /admin/users', () => {
    it('should return list of all registered users for admin', async () => {
      const res = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PUT /admin/users/:id/role', () => {
    it('should allow admin to update user role to admin', async () => {
      const res = await request(app)
        .put(`/admin/users/${normalUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should allow admin to delete user', async () => {
      const res = await request(app)
        .delete(`/admin/users/${normalUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });
});
