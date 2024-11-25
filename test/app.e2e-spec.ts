import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole } from '../src/user/enums/user-role.enum';
import * as path from 'path';
import * as fs from 'fs';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {

    it('POST /user - should create and register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'email@example.com',
          password: 'Pass@123',
          role: UserRole.ADMIN
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('email@example.com');
    });

    it('POST /user - should throw error 409 if already a registered user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'email@example.com',
          password: 'Pass@123',
          role: UserRole.ADMIN
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email already exists');
    });

    it('POST /auth/login - should login the user', async () => {
      const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'email@example.com',
        password: 'Pass@123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
    })

    it('POST /auth/login - should throw error login user is invalid', async () => {
      const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalidemail@example.com',
        password: 'Pass@123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email is not registered!');
    })
  });
  
  describe('User Management', () => {
    let access_token: string;
    let createdUserId: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'email@example.com', password: 'Pass@123' });

      access_token = loginResponse.body.access_token;
    });

    it('POST /user - should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'email1@example.com',
          password: 'Pass@123',
          role: UserRole.EDITOR
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('email1@example.com');

      createdUserId = response.body.id;
    });

    it('GET /user - should fetch all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${access_token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('GET /user/:id - should fetch a user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/${createdUserId}`)
        .set('Authorization', `Bearer ${access_token}`);
        
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.email).toBe('email1@example.com');
    });

    it('PATCH /users/:id - should update a user by ID', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/user/${createdUserId}`)
        .set('Authorization', `Bearer ${access_token}`)
        .send({
          role: UserRole.VIEWER,
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.role).toBe(UserRole.VIEWER);
    });

    it('DELETE /user/:id - should delete a user by ID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/user/${createdUserId}`)
        .set('Authorization', `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

  });

  describe('Documents', () => {
    let documentId: string;
    let access_token: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'email@example.com', password: 'Pass@123' });

      access_token = loginResponse.body.access_token;
    });

    describe('POST /documents', () => {
      it('should upload a new document', async () => {
  
        const filePath = path.resolve(__dirname, './test-files/logo.png');
  
        if (!fs.existsSync(filePath)) {
          throw new Error(`Test file not found at ${filePath}`);
        }
  
        const response = await request(app.getHttpServer())
          .post('/documents')
          .set('Authorization', `Bearer ${access_token}`)
          .attach('file', filePath) // Ensure this file exists in your test directory
          .field('title', 'Test Document');
  
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Test Document');
        documentId = response.body.id; // Save the document ID for other tests
      });
  
      it('should return 400 if file is not uploaded', async () => {
        const response = await request(app.getHttpServer())
          .post('/documents')
          .set('Authorization', `Bearer ${access_token}`)
          .field('title', 'Incomplete Document');
  
        expect(response.status).toBe(400);
      });
    });

    it('GET /documents - should return all documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    describe('GET /documents/:id', () => {
      it('should return a document by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/documents/${documentId}`)
          .set('Authorization', `Bearer ${access_token}`);
  
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', documentId);
      });
  
      it('should return 400 for a non-existent document', async () => {
        const response = await request(app.getHttpServer())
          .get('/documents/3181efd0-ffd0-5555-999d-77f7a07b7d7c')
          .set('Authorization', `Bearer ${access_token}`);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Document not found');
      });
    })

    describe('PATCH /documents/:id', () => {
      it('should update a document by ID', async () => {
        const filePath = path.resolve(__dirname, './test-files/updated-logo.png');
  
        if (!fs.existsSync(filePath)) {
          throw new Error(`Test file not found at ${filePath}`);
        }
  
        const response = await request(app.getHttpServer())
          .patch(`/documents/${documentId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .attach('file', filePath) // Ensure this file exists in your test directory
          .field('title', 'Updated Test Document');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('title', 'Updated Test Document');
      });
  
      it('should return 400 for updating a non-existent id', async () => {
        const response = await request(app.getHttpServer())
          .patch('/documents/3181efd0-ffd0-5555-999d-77f7a07b7d7c')
          .set('Authorization', `Bearer ${access_token}`)
          .field('title', 'Non-existent Document');
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Document not found');
      });
  
      it('should return 400 for updating a document with no document attached', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/documents/${documentId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .field('title', 'Non-existent Document');
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Attach the document');
      });
    })

    describe('DELETE /documents/:id', () => {
      it('should delete a document by ID', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/documents/${documentId}`)
          .set('Authorization', `Bearer ${access_token}`);
        
        expect(response.status).toBe(200);
        expect(response.ok).toBe(true);
      });
  
      it('should return 400 for deleting a non-existent document', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/documents/3181efd0-ffd0-5555-999d-77f7a07b7d7c`)
          .set('Authorization', `Bearer ${access_token}`);
  
        expect(response.status).toBe(400);
      });
    })

  });

  describe('Ingestion', () => {
    let documentId: string;
    let access_token: string;
    let ingestionId: string;

    beforeAll(async () => {

      // Authenticate and get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'email@example.com', password: 'Pass@123' });

      access_token = loginResponse.body.access_token;

      // Create a document for ingestion
      const filePath = path.resolve(__dirname, './test-files/logo.png');

      if (!fs.existsSync(filePath)) {
        throw new Error(`Test file not found at ${filePath}`);
      }
      const documentResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${access_token}`)
        .attach('file', filePath) // Ensure file exists
        .field('title', 'Test Document');
      
      documentId = documentResponse.body.id;
    });

    it('POST /ingestion - should trigger a new ingestion process', async () => {
      const response = await request(app.getHttpServer())
        .post('/ingestion')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ documentId });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'pending');
      ingestionId = response.body.id; // Save the ingestion ID for subsequent tests
    });

    it('POST /ingestion - should return 400 for invalid document ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/ingestion')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ documentId: '3181efd0-ffd0-5555-999d-77f7a07b7d7c' });
      expect(response.status).toBe(400);
    });

    it('GET /ingestion - should fetch all ingestion processes', async () => {
      const response = await request(app.getHttpServer())
        .get('/ingestion')
        .set('Authorization', `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items[0]).toHaveProperty('id', ingestionId);
    });

    describe('GET /ingestion/:id', () => {
      it('should fetch ingestion process by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/ingestion/${ingestionId}`)
          .set('Authorization', `Bearer ${access_token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', ingestionId);
      });
  
      it('should return 400 for non-existent ID', async () => {
        const response = await request(app.getHttpServer())
          .get('/ingestion/3181efd0-ffd0-5555-999d-77f7a07b7d7c')
          .set('Authorization', `Bearer ${access_token}`);

        expect(response.status).toBe(400);
      });
    });

    describe('POST /ingestion/reprocess-failed', () => {
      it('should reprocess failed ingestion processes', async () => {
        // Simulate a failed ingestion for testing
        await request(app.getHttpServer())
          .patch(`/ingestion/${ingestionId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({ status: 'FAILED' });
  
        const response = await request(app.getHttpServer())
          .post('/ingestion/reprocess-failed')
          .set('Authorization', `Bearer ${access_token}`);

        expect(response.status).toBe(201);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('status', 'pending');
      });
    });
  })  
  
});
