# Limitra

A Redis-backed rate limiter for Node.js and Express with support for Fixed Window, Sliding Window, and Token Bucket algorithms.

## Features

- Redis-backed rate limiting
- Three rate limiting algorithms:
  - Fixed Window
  - Sliding Window
  - Token Bucket
- Atomic Redis operations using Lua scripts
- IP-based rate limiting
- Configurable rate limits and windows
- Standard rate-limit response headers
- `429 Too Many Requests` responses
- Centralized error handling
- Graceful Redis shutdown
- Docker support
- Concurrent request handling
- Automated tests with Vitest and Supertest
- TypeScript

## Tech Stack

- Node.js
- TypeScript
- Express
- Redis
- Docker
- Vitest
- Supertest
- dotenv

## How It Works

Limitra sits between the incoming HTTP request and the application route.

For each request, the middleware:

1. Gets the client's IP address.
2. Passes the IP to the configured rate limiter.
3. The selected algorithm checks Redis to determine whether the request is allowed.
4. Adds rate-limit headers to the response.
5. If the limit is exceeded, returns a `429 Too Many Requests` response.
6. If the request is allowed, continues to the application route.

## Rate Limiting Algorithms

### Fixed Window

Divides time into fixed intervals.

For example, with a limit of 10 requests per 60 seconds:

- Requests 1–10 are allowed.
- Request 11 is rejected.
- The counter resets when the next window begins.

Redis stores a counter for each IP and time window.

### Sliding Window

Tracks individual request timestamps using a Redis Sorted Set.

Old requests are removed as they fall outside the configured window. This provides a more precise limit than Fixed Window and avoids the boundary burst that can occur with fixed windows.

### Token Bucket

Each client has a bucket containing tokens.

- The bucket has a maximum capacity.
- Tokens are added over time according to the configured refill rate.
- Each request consumes tokens.
- A request is rejected when there are not enough tokens.

This allows controlled bursts while maintaining a long-term request rate.

## Using Limitra in Your Own Project

This project is currently provided as source code rather than an npm package.

To use the rate limiter in another Node.js/Express project:

1. Copy the `src/rate-limiter` directory into your project.
2. Copy the Redis client implementation.
3. Install the required dependencies.
4. Configure your Redis connection.
5. Create a limiter using the desired algorithm.
6. Attach the rate-limit middleware to the routes you want to protect.

Example:

```ts
import { getRateLimitConfig } from "./rate-limiter/config.js"
import { createRateLimiter } from "./rate-limiter/factory.js"
import { createRateLimitMiddleware } from "./rate-limiter/middleware.js"

const config = getRateLimitConfig()

const limiter = createRateLimiter(config)

app.use("/api", createRateLimitMiddleware(limiter))
```

## Installation & Setup

### Prerequisites

Make sure the following are installed on your system:

- Node.js
- npm
- Redis

You can verify the installations with:

```bash
node --version
npm --version
redis-server --version
```

### Clone the Repository

Clone the repository and move into the project directory:

```bash
git clone <your-repository-url>
cd limitra
```

### Install Dependencies

Install the project dependencies:

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
RATE_LIMIT_ALGORITHM=fixed
RATE_LIMIT=10
WINDOW_SIZE=60
REFILL_RATE=1
REQUEST_COST=1
REDIS_URL=redis://localhost:6379
```

#### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `RATE_LIMIT_ALGORITHM` | Rate limiting algorithm: `fixed`, `sliding`, or `token-bucket` | `fixed` |
| `RATE_LIMIT` | Maximum requests allowed in a window / bucket capacity | `10` |
| `WINDOW_SIZE` | Fixed/Sliding Window size in seconds | `60` |
| `REFILL_RATE` | Number of tokens added per second for Token Bucket | `1` |
| `REQUEST_COST` | Number of tokens consumed by each request | `1` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

### Start Redis

Make sure Redis is running before starting the application.

For a local Redis installation:

```bash
redis-server
```

You can verify that Redis is running with:

```bash
redis-cli ping
```

You should receive:

```text
PONG
```

### Start the Application

#### Development

Start the application in development mode:

```bash
npm run dev
```

The server will start at:

```text
http://localhost:3000
```

#### Production

Build the TypeScript project:

```bash
npm run build
```

Then start the compiled application:

```bash
npm start
```

The server will be available at:

```text
http://localhost:3000
```

### Test the Rate Limiter

The project includes a test endpoint:

```http
GET /api/test
```

Send a request using `curl`:

```bash
curl http://localhost:3000/api/test
```

A successful request returns:

```json
{
  "message": "Request allowed"
}
```

Once the configured rate limit is exceeded, the server responds with:

```http
HTTP/1.1 429 Too Many Requests
```

with the following response body:

```json
{
  "message": "Too many requests"
}
```

### Run Tests

Run the complete test suite:

```bash
npm test
```

To run Vitest in watch mode:

```bash
npm run test:watch
```

### Build Verification

You can verify that the TypeScript project builds successfully with:

```bash
npm run build
```

The compiled output is generated in the `dist` directory.

> **Note:** Docker setup is documented separately in the [Docker](#docker) section. The project supports running both the API and Redis through Docker Compose.

## Response Headers

For every request processed by the rate limiter, the middleware can return the following headers:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Maximum number of requests/tokens allowed |
| `X-RateLimit-Remaining` | Number of requests/tokens remaining |
| `X-RateLimit-Reset` | Number of seconds until the current limit can reset or a request can be retried |
| `Retry-After` | Number of seconds the client should wait before retrying after being rate limited |

### Successful Request

When a request is allowed, the response includes the rate-limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 42
```

The application route can then return its normal response:

```json
{
  "message": "Request allowed"
}
```

### Rate Limited Request

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 20
Retry-After: 20
```

Response body:

```json
{
  "message": "Too many requests"
}
```

The `Retry-After` header tells the client how many seconds it should wait before trying again.

### Error Handling

If the rate limiter cannot communicate with Redis or another internal error occurs, the request is passed to the centralized error handler.

The server responds with:

```http
HTTP/1.1 503 Service Unavailable
```

Response body:

```json
{
  "message": "Internal server error"
}
```

## Docker

Limitra includes Docker support for running both the API and Redis together using Docker Compose.

### Prerequisites

Make sure Docker and Docker Compose are installed:

```bash
docker --version
docker compose version
```

### Start the Application

Build and start the containers:

```bash
docker compose up --build
```

This starts:

1. Limitra API
2. Redis

The API will be available at:

```text
http://localhost:3000
```

Redis will be available on:

```text
localhost:6379
```

#### Run in the Background

To start the containers in detached mode:

```bash
docker compose up --build -d
```

#### Check Container Status

```bash
docker compose ps
```

Both the API and Redis containers should be running.

#### View Logs

To view the API logs:

```bash
docker compose logs api
```

To view Redis logs:

```bash
docker compose logs redis
```

To follow the logs in real time:

```bash
docker compose logs -f
```

### Test the API

Once the containers are running:

```bash
curl http://localhost:3000/api/test
```

A successful request returns:

```json
{
  "message": "Request allowed"
}
```

After the configured rate limit is exceeded, the API returns:

```http
HTTP/1.1 429 Too Many Requests
```

### Stop the Containers

To stop the running containers:

```bash
docker compose down
```

This stops and removes the containers while keeping the Docker images available for future runs.

### Rebuild After Changes

If you make changes to the application code or Docker configuration, rebuild the containers with:

```bash
docker compose up --build
```

## Project Structure

```text
limitra/
├── src/
│   ├── rate-limiter/
│   │   ├── fixed-window.ts
│   │   ├── sliding-window.ts
│   │   ├── token-bucket.ts
│   │   ├── middleware.ts
│   │   ├── factory.ts
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── scripts/
│   │       ├── fixed-window.lua
│   │       ├── sliding-window.lua
│   │       └── token-bucket.lua
│   │
│   ├── redis/
│   │   └── client.ts
│   │
│   ├── middleware/
│   │   └── error-handler.ts
│   │
│   ├── app.ts
│   └── index.ts
│
├── tests/
│   ├── fixed-window.test.ts
│   ├── sliding-window.test.ts
│   ├── token-bucket.test.ts
│   ├── factory.test.ts
│   ├── config.test.ts
│   └── middleware.test.ts
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tsconfig.test.json
├── .env
└── README.md
```

### Directory Responsibilities

**`src/rate-limiter/`**
Contains the core rate-limiting implementation. Each algorithm implements the common `RateLimiter` interface, allowing the rest of the application to work with any algorithm without depending on its internal implementation.

**`src/rate-limiter/scripts/`**
Contains the Redis Lua scripts used by the rate-limiting algorithms. The scripts keep multi-step Redis operations atomic, which is important when multiple requests are processed concurrently.

**`src/redis/`**
Contains the Redis client and connection management.

**`src/middleware/`**
Contains application-level middleware such as centralized error handling.

**`src/app.ts`**
Creates and configures the Express application. The rate limiter is injected into the application instead of being created directly inside it.

**`src/index.ts`**
Application entry point. It:

1. Loads environment configuration.
2. Connects to Redis.
3. Creates the rate limiter.
4. Creates the Express application.
5. Starts the HTTP server.
6. Handles graceful shutdown.

**`tests/`**
Contains unit and integration tests for the rate-limiting algorithms, configuration, factory, middleware, and error handling.

### Architecture

```text
                    HTTP Request
                         │
                         ▼
              ┌──────────────────────┐
              │ Rate Limit Middleware │
              └──────────┬────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ RateLimiter  │
                  │   Interface  │
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  │    Factory   │
                  └──────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   Fixed Window    Sliding Window   Token Bucket
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                      Redis
                         │
                         ▼
                   Lua Scripts
```

## Testing

Limitra uses Vitest for testing and Supertest for testing the Express middleware.

The test suite covers the rate-limiting algorithms, configuration, factory, middleware, error handling, and concurrent requests.

### Run the Test Suite

Run all tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

#### Test Coverage

The tests cover:

1. Fixed Window rate limiting
2. Sliding Window rate limiting
3. Token Bucket rate limiting
4. Rate-limit configuration validation
5. Algorithm factory
6. Rate-limit middleware
7. Response headers
8. 429 Too Many Requests responses
9. Error handling when the limiter fails
10. Redis TTL and expiration behavior
11. Token refill behavior
12. Concurrent requests

#### Concurrency Testing

Rate limiting needs to behave correctly when multiple requests arrive at the same time.

Limitra includes concurrent request tests that send multiple requests simultaneously to the same limiter.

For example, with a limit of 10 requests, 100 concurrent requests should result in:

```text
Allowed:  10
Rejected: 90
```

The Redis Lua scripts ensure that the read, decision, and update operations required by each algorithm are executed atomically. This prevents multiple concurrent requests from incorrectly bypassing the configured limit.

## Design Decisions & Trade-offs

### Why Redis?

Redis is well suited for rate limiting because it provides fast in-memory operations and supports data structures that map naturally to different rate-limiting algorithms.

Limitra uses:

- Redis Strings for Fixed Window counters
- Redis Sorted Sets for Sliding Window request timestamps
- Redis Hashes for Token Bucket state

Redis also provides atomic operations that are important when multiple requests are processed concurrently.

### Why Lua Scripts?

Some rate-limiting operations require multiple Redis commands to be executed as one logical operation.

For example, a Token Bucket request may need to:

1. Read the current token count.
2. Calculate newly available tokens.
3. Check whether the request can be allowed.
4. Update the token count.
5. Store the latest refill timestamp.

Executing these operations separately could allow concurrent requests to interfere with each other. Lua scripts allow these operations to execute atomically inside Redis.

### Why a Common `RateLimiter` Interface?

All three algorithms solve the same problem but use different internal implementations. The common interface provides a consistent contract:

```ts
interface RateLimiter {
  check(ip: string): Promise<RateLimitResult>
}
```

The middleware only needs to know whether a request is allowed and the associated rate-limit information. It does not need to know which algorithm is being used. This makes the algorithms interchangeable without changing the middleware.

### Why a Factory?

The factory is responsible for selecting the rate-limiter implementation based on the configured algorithm.

```text
Configuration
      │
      ▼
   Factory
      │
      ├── Fixed Window
      ├── Sliding Window
      └── Token Bucket
```

This keeps algorithm selection separate from the Express application and makes the application easier to configure.

### Why Dependency Injection?

The Express application receives a `RateLimiter` instead of creating one internally.

```ts
const limiter = createRateLimiter(config)

const app = createApp(limiter)
```

This keeps the application independent from a specific rate-limiting implementation and makes the middleware easier to test with different limiter implementations.

### Trade-offs

Each algorithm has different characteristics.

| Algorithm | Main Advantage | Main Trade-off |
|---|---|---|
| Fixed Window | Simple and efficient | Can allow bursts around window boundaries |
| Sliding Window | More precise request tracking | Requires storing individual request timestamps |
| Token Bucket | Supports controlled bursts and gradual refilling | Requires maintaining token state and refill calculations |

The choice of algorithm depends on the requirements of the application.

## Limitations

The current implementation has some intentional limitations:

- Rate limiting is based on client IP addresses.
- The project is designed for Node.js and Express.
- Redis is required for shared rate-limit state.
- The project is provided as source code rather than an npm package.
- The example application exposes a simple test endpoint rather than a complete production API.

## Future Improvements

Possible improvements for future versions include:

- Support for additional rate-limiting strategies
- More configurable middleware options
- Support for additional web frameworks
- More detailed metrics and observability
- Distributed deployment improvements
- Publishing the project as an npm package

## License

This project is licensed under the ISC License.