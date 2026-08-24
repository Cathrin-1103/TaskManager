import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { connectTestDB, disconnectTestDB } from './helpers';

describe('Auth Endpoints (/auth/register, /auth/login, /auth/logout, /auth/forgot-password)', () => {
  const timestamp = Date.now();
  const testUser = {
    username: 'test_user',
    email: `user_${timestamp}@test.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await disconnectTestDB();
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid username, email & password regex successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should return 400 if email fails regex check', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'test_user',
          email: 'invalid-email-format',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Valid email address is required');
    });

    it('should return 400 if password fails regex check (missing special char)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'test_user',
          email: `test_pwd_${Date.now()}@test.com`,
          password: 'onlyletters',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('special character');
    });

    it('should return 400 if registering a duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate user, set HTTP-Only cookies, and return token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('username', 'test_user');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should cap refreshTokens array at maximum 5 tokens', async () => {
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/auth/login')
          .send({ email: testUser.email, password: testUser.password });
      }

      const dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser).toBeDefined();
      expect(dbUser?.refreshTokens.length).toBeLessThanOrEqual(5);
    });

    it('should preserve password whitespace and return 401 when whitespace is omitted', async () => {
      const spaceUser = {
        username: 'space_user',
        email: `space_${Date.now()}@test.com`,
        password: ' Password123! ',
      };

      const regRes = await request(app).post('/auth/register').send(spaceUser);
      expect(regRes.status).toBe(201);

      const loginSuccess = await request(app).post('/auth/login').send({
        email: spaceUser.email,
        password: ' Password123! ',
      });
      expect(loginSuccess.status).toBe(200);
      expect(loginSuccess.body).toHaveProperty('token');

      const loginFail = await request(app).post('/auth/login').send({
        email: spaceUser.email,
        password: 'Password123!',
      });
      expect(loginFail.status).toBe(401);
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current authenticated user profile', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.username).toBe(testUser.username);
    });
  });

  describe('POST /auth/forgot-password & /auth/reset-password', () => {
    it('should generate reset token and allow resetting password', async () => {
      const forgotRes = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      expect(forgotRes.status).toBe(200);
      const resetToken = forgotRes.body.resetToken;
      expect(resetToken).toBeDefined();

      const newPassword = 'NewPassword123!';
      const resetRes = await request(app)
        .post('/auth/reset-password')
        .send({ token: resetToken, newPassword });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('Password has been reset successfully');

      // Verify login works with new password
      const newLogin = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: newPassword });

      expect(newLogin.status).toBe(200);

      // Revert password
      await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });
      const dbUser = await User.findOne({ email: testUser.email });
      if (dbUser?.resetPasswordToken) {
        await request(app)
          .post('/auth/reset-password')
          .send({ token: dbUser.resetPasswordToken, newPassword: testUser.password });
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should generate a new access token when provided a valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const refreshToken = loginRes.body.refreshToken;

      const refreshRes = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('token');
    });

    it('should return 401 if refresh token has been revoked after logout', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const refreshToken = loginRes.body.refreshToken;

      await request(app).post('/auth/logout').send({ refreshToken });

      const refreshRes = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body).toHaveProperty('message', 'Invalid or revoked refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully log out user and invalidate refresh token', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const refreshToken = loginRes.body.refreshToken;

      const logoutRes = await request(app)
        .post('/auth/logout')
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});
