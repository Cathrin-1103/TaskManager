import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { connectTestDB, disconnectTestDB } from './helpers';

describe('Auth Endpoints (/auth/register, /auth/login, /auth/logout)', () => {
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
    it('should authenticate user via email & password (without needing username on login) and return token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('username', 'test_user');
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
