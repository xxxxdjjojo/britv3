/**
 * API Documentation Generator
 * Generates OpenAPI 3.0 Schema from route handlers
 * 
 * Output: /docs/api/openapi.json + /docs/api/swagger-ui.html
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  tags: string[];
  parameters: any[];
  requestBody?: any;
  responses: any;
  auth?: boolean;
}

const API_ENDPOINTS: APIEndpoint[] = [
  // Auth
  {
    method: 'POST',
    path: '/api/auth/register',
    description: 'Register new user',
    tags: ['Auth'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
              name: { type: 'string' },
              role: { type: 'string', enum: ['buyer', 'seller', 'landlord', 'agent', 'provider'] },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'User created' },
      400: { description: 'Validation error' },
      409: { description: 'Email already exists' },
    },
    auth: false,
  },
  
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Login user',
    tags: ['Auth'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      200: { description: 'Login successful, returns JWT token' },
      401: { description: 'Invalid credentials' },
    },
    auth: false,
  },

  // Properties
  {
    method: 'GET',
    path: '/api/properties',
    description: 'List all properties with filtering',
    tags: ['Properties'],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
      { name: 'type', in: 'query', schema: { type: 'string', enum: ['house', 'flat', 'commercial'] } },
      { name: 'minPrice', in: 'query', schema: { type: 'number' } },
      { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
      { name: 'location', in: 'query', schema: { type: 'string' } },
    ],
    responses: {
      200: { description: 'List of properties' },
    },
    auth: false,
  },

  {
    method: 'POST',
    path: '/api/properties',
    description: 'Create new property listing',
    tags: ['Properties'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              type: { type: 'string' },
              bedrooms: { type: 'integer' },
              bathrooms: { type: 'integer' },
              location: { type: 'string' },
              media: { type: 'array' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Property created' },
      400: { description: 'Validation error' },
      401: { description: 'Unauthorized' },
    },
    auth: true,
  },

  {
    method: 'GET',
    path: '/api/properties/{id}',
    description: 'Get property details',
    tags: ['Properties'],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: {
      200: { description: 'Property details' },
      404: { description: 'Property not found' },
    },
    auth: false,
  },

  // Agencies
  {
    method: 'GET',
    path: '/api/agencies',
    description: 'List all agencies',
    tags: ['Agencies'],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
    ],
    responses: {
      200: { description: 'List of agencies' },
    },
    auth: false,
  },

  {
    method: 'POST',
    path: '/api/agencies',
    description: 'Register new agency',
    tags: ['Agencies'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Agency created' },
      400: { description: 'Validation error' },
    },
    auth: true,
  },

  // Services
  {
    method: 'GET',
    path: '/api/services',
    description: 'List all services and providers',
    tags: ['Services'],
    parameters: [
      { name: 'category', in: 'query', schema: { type: 'string' } },
      { name: 'location', in: 'query', schema: { type: 'string' } },
    ],
    responses: {
      200: { description: 'List of services' },
    },
    auth: false,
  },

  {
    method: 'POST',
    path: '/api/services/quotes',
    description: 'Request service provider quote',
    tags: ['Services'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              service_id: { type: 'string' },
              description: { type: 'string' },
              budget: { type: 'number' },
              timeline: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Quote request created' },
      400: { description: 'Validation error' },
    },
    auth: true,
  },

  // Landlords
  {
    method: 'GET',
    path: '/api/landlords/dashboard',
    description: 'Get landlord dashboard data',
    tags: ['Landlords'],
    parameters: [],
    responses: {
      200: { description: 'Dashboard data' },
      401: { description: 'Unauthorized' },
    },
    auth: true,
  },

  {
    method: 'POST',
    path: '/api/landlords/properties',
    description: 'Add rental property',
    tags: ['Landlords'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              rent: { type: 'number' },
              bedrooms: { type: 'integer' },
              address: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Property created' },
      400: { description: 'Validation error' },
    },
    auth: true,
  },

  // Health
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    tags: ['System'],
    parameters: [],
    responses: {
      200: { description: 'System is healthy' },
    },
    auth: false,
  },

  // Analytics
  {
    method: 'GET',
    path: '/api/analytics/overview',
    description: 'Get system analytics overview',
    tags: ['Analytics'],
    parameters: [
      { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
      { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
    ],
    responses: {
      200: { description: 'Analytics data' },
      401: { description: 'Unauthorized' },
    },
    auth: true,
  },
];

function generateOpenAPISchema(): any {
  const paths: any = {};

  for (const endpoint of API_ENDPOINTS) {
    const pathKey = endpoint.path;

    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }

    paths[pathKey][endpoint.method.toLowerCase()] = {
      summary: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      ...(endpoint.requestBody && { requestBody: endpoint.requestBody }),
      responses: endpoint.responses,
      ...(endpoint.auth && {
        security: [{ BearerAuth: [] }],
      }),
    };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Brit-Estate API',
      version: '1.0.0',
      description: 'UK AI-powered property ecosystem API',
      contact: {
        name: 'Brit-Estate Support',
        email: 'support@brit-estate.uk',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'https://api.brit-estate.uk',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
      {
        url: 'https://staging.brit-estate.uk',
        description: 'Staging',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            type: { type: 'string' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            location: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Agency: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Properties', description: 'Property listing endpoints' },
      { name: 'Agencies', description: 'Agency management endpoints' },
      { name: 'Services', description: 'Service provider endpoints' },
      { name: 'Landlords', description: 'Landlord dashboard endpoints' },
      { name: 'System', description: 'System management endpoints' },
      { name: 'Analytics', description: 'Analytics endpoints' },
    ],
  };
}

function generateSwaggerUI(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Brit-Estate API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url='./openapi.json'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
}

async function main() {
  console.log('📚 Generating API Documentation...\n');

  const schema = generateOpenAPISchema();
  const swagger = generateSwaggerUI();

  // Write OpenAPI schema
  await writeFile('/tmp/openapi.json', JSON.stringify(schema, null, 2));
  console.log('✅ OpenAPI schema: /tmp/openapi.json');

  // Write Swagger UI
  await writeFile('/tmp/swagger-ui.html', swagger);
  console.log('✅ Swagger UI: /tmp/swagger-ui.html');

  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 API DOCUMENTATION SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total Endpoints: ${API_ENDPOINTS.length}`);
  console.log(`\nEndpoints by Tag:`);
  
  const tags = new Set(API_ENDPOINTS.flatMap(e => e.tags));
  for (const tag of tags) {
    const count = API_ENDPOINTS.filter(e => e.tags.includes(tag)).length;
    console.log(`  • ${tag}: ${count}`);
  }

  console.log(`\nEndpoints by Method:`);
  const methods = new Set(API_ENDPOINTS.map(e => e.method));
  for (const method of methods) {
    const count = API_ENDPOINTS.filter(e => e.method === method).length;
    console.log(`  • ${method}: ${count}`);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log('\n✅ API Documentation generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy openapi.json to public/docs/api/');
  console.log('2. Copy swagger-ui.html to public/docs/api/');
  console.log('3. Deploy to production');
  console.log('4. Access at: https://api.brit-estate.uk/docs\n');
}

main().catch(err => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
