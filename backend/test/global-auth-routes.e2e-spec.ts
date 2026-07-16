import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/core/filters/http-exception.filter';
import {
  JWT_UNAUTHORIZED_MESSAGE,
  PROTECTED_API_ROUTES,
  PUBLIC_API_ROUTES,
  PublicRouteSpec,
} from '../src/core/constants/public-routes.constants';

function isJwtUnauthorized(status: number, body: { message?: string | string[] }): boolean {
  if (status !== 401) return false;
  const msg = body?.message;
  if (Array.isArray(msg)) {
    return msg.some((m) => m.includes(JWT_UNAUTHORIZED_MESSAGE));
  }
  return typeof msg === 'string' && msg.includes(JWT_UNAUTHORIZED_MESSAGE);
}

async function hitRoute(
  app: INestApplication,
  spec: PublicRouteSpec,
): Promise<request.Response> {
  const agent = request(app.getHttpServer());
  const url = `/api/v1${spec.path}`;
  switch (spec.method) {
    case 'GET':
      return agent.get(url);
    case 'POST':
      return agent.post(url).send(spec.body ?? {});
    case 'PUT':
      return agent.put(url).send(spec.body ?? {});
    case 'PATCH':
      return agent.patch(url).send(spec.body ?? {});
    case 'DELETE':
      return agent.delete(url);
    default:
      throw new Error(`Unsupported method: ${spec.method}`);
  }
}

describe('Global JwtAuthGuard (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  describe('known-public routes (no JWT)', () => {
    it.each(PUBLIC_API_ROUTES.map((r) => [`${r.method} ${r.path}`, r] as const))(
      '%s is not blocked by JwtAuthGuard',
      async (_label, route) => {
        const res = await hitRoute(app, route);
        expect(isJwtUnauthorized(res.status, res.body)).toBe(false);
      },
    );
  });

  describe('known-protected routes (no JWT)', () => {
    it.each(PROTECTED_API_ROUTES.map((r) => [`${r.method} ${r.path}`, r] as const))(
      '%s requires JWT',
      async (_label, route) => {
        const res = await hitRoute(app, route);
        expect(isJwtUnauthorized(res.status, res.body)).toBe(true);
      },
    );
  });

  it('POST /auth/logout is JWT-protected (intentional fix)', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/logout');
    expect(isJwtUnauthorized(res.status, res.body)).toBe(true);
  });
});
