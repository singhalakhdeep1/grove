# 🏗️ Architecture Documentation

## System Overview

Grove is a microservices-inspired monolithic application built with NestJS (backend) and Next.js (frontend). The architecture follows clean architecture principles with separation of concerns, scalability, and maintainability as key design goals.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
│                    Next.js 14 + React                             │
│                   (Server-Side Rendering)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                               │
│                      NestJS + Express                             │
│              (REST API + WebSocket Gateway)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│ PostgreSQL   │  │  Redis   │  │  AWS S3      │
│   Database   │  │  Cache   │  │  Storage     │
│   (Prisma)   │  │          │  │              │
└──────────────┘  └──────────┘  └──────────────┘
```

## Backend Architecture

### Module Structure

The backend follows NestJS's modular architecture where each feature is encapsulated in its own module:

```
backend/src/
├── auth/                    # Authentication & Authorization
│   ├── auth.controller.ts    # HTTP endpoints
│   ├── auth.service.ts      # Business logic
│   ├── auth.module.ts       # Module configuration
│   ├── strategies/          # Passport strategies
│   ├── guards/              # Route guards
│   └── dto/                 # Data transfer objects
├── courses/                 # Course management
├── live-sessions/           # WebRTC video sessions
├── forums/                  # Discussion forums
├── messaging/               # Real-time messaging
├── gamification/            # Basic gamification
├── advanced-gamification/   # Advanced gamification
├── mentorship/              # 1-on-1 mentoring
├── study-groups/            # Study groups
├── certification/           # Certifications
├── analytics/               # Learning analytics
├── realtime-analytics/      # Real-time analytics
├── recommendations/         # AI recommendations
├── video/                   # Interactive video
├── two-factor/              # 2FA authentication
├── subscriptions/           # Payments & subscriptions
├── prisma/                  # Database client
├── redis/                   # Redis client
├── common/                  # Shared utilities
└── app.module.ts           # Root module
```

### Design Patterns

#### 1. Repository Pattern
- Prisma service acts as repository layer
- Abstracts database operations
- Provides type-safe database access

#### 2. Service Layer Pattern
- Business logic in service classes
- Controllers handle HTTP concerns
- Services handle business rules

#### 3. Dependency Injection
- NestJS's built-in DI container
- Loose coupling between components
- Easy testing and maintenance

#### 4. Strategy Pattern
- Multiple authentication strategies (JWT, OAuth2)
- Interchangeable algorithms for recommendations
- Different payment methods

#### 5. Observer Pattern
- WebSocket gateways for real-time updates
- Event emitters for system events
- Reactive programming with RxJS

### Key Architectural Decisions

#### Why NestJS?
- **TypeScript-first**: Built-in type safety
- **Modular architecture**: Easy to scale and maintain
- **Enterprise features**: Guards, interceptors, pipes
- **Community support**: Large ecosystem and documentation
- **Performance**: Built on Express with additional optimizations

#### Why Prisma?
- **Type-safe**: Auto-generated TypeScript types
- **Migrations**: Built-in migration system
- **Performance**: Optimized query generation
- **Developer experience**: Excellent IDE support

#### Why Redis?
- **Caching**: Reduce database load
- **Session storage**: Fast session management
- **Rate limiting**: API rate limiting
- **Pub/Sub**: Real-time messaging support

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication route group
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/        # Dashboard route group
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── forums/
│   │   └── ...
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── video/             # Video-specific components
│   └── providers.tsx      # Context providers
├── lib/                   # Utilities
│   ├── api.ts             # API client
│   └── utils.ts           # Helper functions
├── store/                 # State management
│   └── authStore.ts       # Auth state
├── types/                 # TypeScript types
│   └── index.ts           # Type definitions
└── hooks/                 # Custom React hooks
```

### Key Patterns

#### 1. Component Composition
- Small, reusable components
- Compound components for complex UI
- Props drilling minimized with context

#### 2. Server Components
- Default to server components for performance
- Client components only when needed
- Optimal data fetching patterns

#### 3. State Management
- Zustand for global state
- React Query for server state
- Local state with useState/useReducer

#### 4. Data Fetching
- TanStack Query for API calls
- Automatic caching and revalidation
- Optimistic updates

## Database Architecture

### Schema Design Principles

1. **Normalization**: Third normal form (3NF)
2. **Relationships**: Proper foreign key constraints
3. **Indexing**: Strategic indexes for performance
4. **Validation**: Database-level constraints
5. **Scalability**: Designed for horizontal scaling

### Key Tables

#### Core Tables
- `users` - User accounts and profiles
- `courses` - Course information
- `lessons` - Course lessons
- `enrollments` - User course enrollments

#### Social Tables
- `forums`, `threads`, `posts` - Forum system
- `conversations`, `messages` - Messaging system
- `study_groups`, `group_members` - Study groups

#### Gamification Tables
- `user_progress` - XP and levels
- `achievements`, `user_achievements` - Achievements
- `teams`, `team_members` - Team challenges
- `virtual_currency`, `currency_transactions` - Currency system

#### Payment Tables
- `subscription_plans` - Subscription plans
- `user_subscriptions` - User subscriptions
- `payments` - Payment records
- `invoices` - Billing invoices

### Indexing Strategy

- Foreign keys indexed
- Frequently queried columns indexed
- Composite indexes for complex queries
- Unique constraints for data integrity

## API Architecture

### RESTful Design

- **Resource-based URLs**: `/api/courses`, `/api/users`
- **HTTP methods**: GET, POST, PUT, DELETE
- **Status codes**: Proper HTTP status codes
- **Versioning**: URL-based versioning (`/api/v1/`)

### WebSocket Architecture

- **Gateway pattern**: NestJS WebSocket gateways
- **Room-based**: Users grouped in rooms
- **Event-driven**: Event-based communication
- **Real-time**: Instant message delivery

### Authentication Flow

```
1. User Login
   ├─ POST /api/auth/login
   ├─ Validate credentials
   ├─ Generate JWT access token
   ├─ Generate refresh token
   └─ Return tokens

2. Access Protected Resource
   ├─ Include access token in header
   ├─ JWT guard validates token
   ├─ Extract user from token
   └─ Process request

3. Token Refresh
   ├─ POST /api/auth/refresh
   ├─ Validate refresh token
   ├─ Generate new access token
   └─ Return new tokens
```

## Security Architecture

### Authentication Layers

1. **JWT Authentication**
   - Access tokens (15 min expiration)
   - Refresh tokens (7 days expiration)
   - Token rotation on refresh

2. **OAuth2 Integration**
   - Google OAuth2
   - Facebook OAuth2
   - Token exchange flow

3. **Two-Factor Authentication**
   - TOTP (Time-based One-Time Password)
   - Backup codes
   - QR code setup

### Authorization Layers

1. **Role-Based Access Control (RBAC)**
   - Student, Instructor, Admin roles
   - Role-based route guards
   - Permission-based resource access

2. **Resource Ownership**
   - Users can only access their own resources
   - Instructors can access their courses
   - Admins have full access

### Security Measures

- **Password hashing**: bcrypt with salt rounds
- **Rate limiting**: API request rate limiting
- **CORS**: Configured CORS policies
- **Helmet.js**: Security headers
- **Input validation**: Comprehensive validation
- **SQL injection prevention**: Prisma ORM
- **XSS protection**: Input sanitization

## Performance Architecture

### Caching Strategy

1. **Redis Caching**
   - User sessions
   - Frequently accessed data
   - API response caching
   - Rate limiting counters

2. **Application-level Caching**
   - In-memory caching (Node.js)
   - Response caching (HTTP)
   - Component caching (React)

### Database Optimization

1. **Query Optimization**
   - Indexed queries
   - Query batching
   - Lazy loading
   - Connection pooling

2. **Database Design**
   - Proper normalization
   - Strategic denormalization
   - Partitioning (future)

### Frontend Performance

1. **Code Splitting**
   - Route-based splitting
   - Component-based splitting
   - Dynamic imports

2. **Asset Optimization**
   - Image optimization (Next.js)
   - Font optimization
   - CSS minification

3. **Rendering Strategy**
   - Server-side rendering (SSR)
   - Static site generation (SSG)
   - Incremental static regeneration (ISR)

## Scalability Architecture

### Horizontal Scaling

- **Stateless API**: Easy to scale horizontally
- **Session storage**: Redis for shared sessions
- **Load balancing**: Ready for load balancer
- **Database replication**: Ready for read replicas

### Vertical Scaling

- **Efficient code**: Optimized algorithms
- **Resource management**: Connection pooling
- **Memory management**: Proper cleanup

### Future Enhancements

- **Microservices**: Can split into microservices
- **Message queue**: RabbitMQ/Kafka for async tasks
- **CDN**: Cloudflare/CloudFront for static assets
- **Database sharding**: For massive scale

## Monitoring & Observability

### Logging

- **Structured logging**: Winston logger
- **Log levels**: Error, warn, info, debug
- **Log aggregation**: Ready for ELK stack

### Metrics

- **API response times**: Performance monitoring
- **Error rates**: Error tracking
- **User metrics**: Analytics tracking

### Health Checks

- **Health endpoints**: `/health`, `/ready`
- **Database connectivity**: Health checks
- **Redis connectivity**: Health checks

## Deployment Architecture

### Container Strategy

- **Docker**: Containerized services
- **Docker Compose**: Local development
- **Kubernetes**: Production-ready

### CI/CD Pipeline

- **GitHub Actions**: Automated CI/CD
- **Automated testing**: Test on every commit
- **Automated deployment**: Deploy on merge
- **Rollback capability**: Easy rollback

### Environment Management

- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live production environment
- **Configuration**: Environment-specific config

## Technology Rationale

### Backend Stack

| Technology | Reason |
|------------|--------|
| NestJS | TypeScript-first, modular, enterprise features |
| Prisma | Type-safe, migrations, excellent DX |
| Redis | Fast caching, session storage, pub/sub |
| Socket.io | Real-time communication |
| Stripe | Payment processing |
| FFmpeg | Video processing |

### Frontend Stack

| Technology | Reason |
|------------|--------|
| Next.js 14 | SSR, SSG, excellent performance |
| React | Component-based, large ecosystem |
| TypeScript | Type safety, better DX |
| Tailwind CSS | Utility-first, rapid development |
| Zustand | Simple state management |
| TanStack Query | Server state management |

This architecture provides a solid foundation for a scalable, maintainable, and feature-rich social learning platform.