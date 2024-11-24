import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Document Management API')
    .setDescription(
      `
      A comprehensive API for managing documents and users with role-based access control.

      Features:
      - User authentication and authorozation
      - Document management with CRUD operations
      - Document ingestion process management
      - Role-based access control (Admin, Editor, Viewer)
    `,
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('documents', 'Document management endpoints')
    .addTag('ingestion', 'Document ingestion process endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // add security requirements globally
  document.security = [{ 'JWT-auth': [] }];

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Document Management API Documentation',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
