import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/User';
import { TaskModel } from '../src/models/Task';
import { connectTestDB, disconnectTestDB } from './helpers';

describe('Task Endpoints (/tasks)', () => {
  const ts = Date.now();
  const userA = { username: 'alex_test', email: `user_a_${ts}@test.com`, password: 'Password123!' };
  const userB = { username: 'sarah_test', email: `user_b_${ts}@test.com`, password: 'Password123!' };

  let tokenA: string;
  let tokenB: string;
  let createdTaskId: string;

  beforeAll(async () => {
    await connectTestDB();
    await request(app).post('/auth/register').send(userA);
    const loginA = await request(app).post('/auth/login').send({ email: userA.email, password: userA.password });
    tokenA = loginA.body.token;

    await request(app).post('/auth/register').send(userB);
    const loginB = await request(app).post('/auth/login').send({ email: userB.email, password: userB.password });
    tokenB = loginB.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [userA.email, userB.email] } });
    await TaskModel.deleteMany({});
    await disconnectTestDB();
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized if no Bearer token is provided', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /tasks', () => {
    it('should create a task with start date (createdAt) and due date (dueDate) for User A', async () => {
      const dueDate = new Date('2026-12-31T23:59:59.000Z').toISOString();

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Task for User A with Due Date', dueDate });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Task for User A with Due Date');
      expect(res.body.authorUsername).toBe('alex_test');
      expect(res.body.dueDate).toBeDefined();

      createdTaskId = res.body.id;
    });

    it('should return 400 if title is missing or empty', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Title required');
    });
  });

  describe('GET /tasks & Shared Workspace Visibility', () => {
    it('should return tasks for User A including the created task', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(createdTaskId);
      expect(res.body[createdTaskId].title).toBe('Task for User A with Due Date');
    });

    it('should ALSO make User A task visible to User B in shared workspace', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(createdTaskId);
      expect(res.body[createdTaskId].title).toBe('Task for User A with Due Date');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should return 403 Forbidden if User B attempts to edit User A task', async () => {
      const res = await request(app)
        .put(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ done: true });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message', 'You are not authorized to modify this task');
    });

    it('should update task status to done by User A (the task creator)', async () => {
      const res = await request(app)
        .put(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ done: true });

      expect(res.status).toBe(200);
      expect(res.body.done).toBe(true);
    });
  });

  describe('POST & DELETE /tasks/:id/like (Idempotent Likes)', () => {
    it('should add a like on task by User A', async () => {
      const res = await request(app)
        .post(`/tasks/${createdTaskId}/like`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.likes.length).toBe(1);
    });

    it('should NOT add duplicate like when POST /tasks/:id/like is called multiple times (Idempotent)', async () => {
      const res1 = await request(app)
        .post(`/tasks/${createdTaskId}/like`)
        .set('Authorization', `Bearer ${tokenA}`);

      const res2 = await request(app)
        .post(`/tasks/${createdTaskId}/like`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res2.body.likes.length).toBe(1);
    });

    it('should un-like task when DELETE /tasks/:id/like is called (Idempotent)', async () => {
      const res = await request(app)
        .delete(`/tasks/${createdTaskId}/like`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.likes.length).toBe(0);
    });
  });

  describe('POST /tasks/:id/comments', () => {
    it('should add a comment to task', async () => {
      const res = await request(app)
        .post(`/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ text: 'Automated test comment' });

      expect(res.status).toBe(200);
      expect(res.body.comments.length).toBe(1);
      expect(res.body.comments[0].username).toBe('alex_test');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should return 403 Forbidden if User B attempts to delete User A task', async () => {
      const res = await request(app)
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message', 'You are not authorized to modify this task');
    });

    it('should allow User A to delete their own task', async () => {
      const res = await request(app)
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Task deleted successfully');
    });
  });
});
