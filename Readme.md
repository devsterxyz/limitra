# limitra

## **Project Overview**

`limitra` is a TypeScript-based rate limiting library and demo server that implements multiple rate-limiting strategies and middleware suitable for use in Node.js/Express-style applications. It includes implementations for fixed-window, sliding-window, and token-bucket algorithms, plus a factory for creating limiters, Redis-backed storage, Lua scripts for server-side enforcement, and middleware to integrate the limiter with request handlers.

This repository is currently being worked on by the author.

## **Status**

- **In progress**: Active development is ongoing. The user is currently working on the project and iterating on implementation and tests.

## **Key Features**

- **Multiple algorithms**: Fixed-window, Sliding-window, Token-bucket.
- **Redis-backed**: Uses Redis for distributed rate limit state.
- **Lua scripts**: Server-side scripts for efficient atomic updates (`src/rate-limiter/scripts`).
- **Middleware**: Express-compatible middleware for request-level enforcement.
- **Factory**: Centralized factory to construct and configure limiters.
- **Tests**: Unit tests using Vitest (`tests/`).

## **Architecture & Components**

- **`src/rate-limiter/factory.ts`**: Factory functions to create limiters and middleware.
- **`src/rate-limiter/fixed-window.ts`**: Fixed-window algorithm implementation.
- **`src/rate-limiter/sliding-window.ts`**: Sliding-window algorithm implementation.
- **`src/rate-limiter/token-bucket.ts`**: Token-bucket algorithm implementation.
- **`src/rate-limiter/middleware.ts`**: Middleware to attach rate limiting to request handlers.
- **`src/rate-limiter/types.ts`**: Shared TypeScript types and interfaces.
- **`src/rate-limiter/scripts/`**: Lua scripts used by Redis for atomic operations.
- **`src/redis/client.ts`**: Redis client wrapper/initialization.
- **`src/app.ts`**, **`src/index.ts`**: Example server bootstrap and entry point.

## **Getting Started**

Prerequisites:

- Node.js (v16+ recommended)
- npm or yarn
- Redis (local or remote). A `docker-compose.yml` is included for convenience.

Quick setup:

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start Redis (local using Docker Compose):

```bash
docker-compose up -d redis
```

3. Copy or create environment configuration if needed (e.g. `.env`). Configure Redis connection as required.

4. Run the example server:

```bash
npm run dev
# or
node -r ts-node/register src/index.ts
```

## **Running Tests**

Unit tests are implemented with Vitest. Run them with:

```bash
npm test
# or
npm run test:watch
```

## **Project Structure**

Top-level layout:

- `src/` - Source TypeScript code.
  - `rate-limiter/` - Core limiter implementations and middleware.
    - `config.ts` - Configuration helpers.
    - `factory.ts` - Limiter factory.
    - `fixed-window.ts` - Fixed-window algorithm.
    - `sliding-window.ts` - Sliding-window algorithm.
    - `token-bucket.ts` - Token-bucket algorithm.
    - `middleware.ts` - Express middleware.
    - `types.ts` - Shared types.
    - `scripts/` - Lua scripts for Redis.
- `redis/` - Redis client wrappers and config.
- `tests/` - Unit tests for each limiter and middleware.
- `docker-compose.yml` - Optional services for local development (Redis).

## **Configuration**

Configuration is centralized in `src/rate-limiter/config.ts`. Typical options include:

- Redis connection parameters.
- Default limits (requests per window, window duration).
- Token refill rates for token-bucket.

Adjust these values to fit your deployment environment.

## **How to Use the Library**

1. Create a limiter using the factory and desired strategy.
2. Attach the limiter middleware to your routes.
3. Optionally use the Lua scripts for performant server-side enforcement.

A minimal usage sketch:

```ts
import { createLimiterFactory } from "./src/rate-limiter/factory";
import redisClient from "./src/redis/client";

const limiterFactory = createLimiterFactory({ redis: redisClient });
const limiter = limiterFactory.fixedWindow({ windowMs: 60000, max: 100 });

app.use(limiter.middleware());
```

Refer to the code in `src/rate-limiter` for full APIs and examples.

## **Testing Notes**

- Tests live under `tests/` and cover each limiter and the middleware integration.
- When modifying algorithms or Lua scripts, run the test suite to ensure atomic behavior remains correct.

## **Contributing**

- Open issues for bugs or feature requests.
- Send pull requests against `main` or an appropriate feature branch.
- Include tests for new behavior where feasible.

## **Next Steps / TODOS**

- Add integration tests that run against a real Redis instance (CI via Docker).
- Add TypeDoc or API documentation for public factory and middleware.
- Harden error handling for Redis connectivity and script loading.

If you'd like, I can run the test suite or update this README with additional usage examples or badges. Tell me what you'd like next.
