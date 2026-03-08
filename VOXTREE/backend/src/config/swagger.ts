import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'VOXTREE Project Management API',
      version: '1.0.0',
      description: `
        A comprehensive project management system API with features for:
        - User authentication and authorization
        - Project and task management
        - Time tracking and billing
        - Invoice generation and payment processing
        - Real-time notifications
      `,
      contact: {
        name: 'VOXINNOV PVT LTD',
        email: 'contact@voxinnov.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.voxtree.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI options
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2563eb; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
    `,
    customSiteTitle: 'VOXTREE API Documentation',
    customfavIcon: '/favicon.ico',
  };

  // Serve Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Serve OpenAPI spec as JSON
  app.get('/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Serve OpenAPI spec as YAML
  app.get('/docs/swagger.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(specs);
  });

  // Serve static Swagger HTML
  app.get('/docs/static', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/swagger.html'));
  });

  console.log('📚 Swagger UI available at: http://localhost:3001/docs');
  console.log('📄 OpenAPI spec (JSON): http://localhost:3001/docs/swagger.json');
  console.log('📄 OpenAPI spec (YAML): http://localhost:3001/docs/swagger.yaml');
  console.log('📄 Static Swagger UI: http://localhost:3001/docs/static');
};

export default setupSwagger;
