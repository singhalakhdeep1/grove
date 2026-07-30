# 🎓 Grove - Social Learning Platform

<div align="center">

![Grove Logo](https://img.shields.io/badge/Grove-Social%20Learning%20Platform-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-success?style=for-the-badge)

**A comprehensive, enterprise-grade social learning platform built with modern technologies**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**Grove** is a full-featured social learning and community platform that combines world-class courses, live sessions, mentorship, and community features to create an engaging learning experience. Built with cutting-edge technologies and following industry best practices, it's designed to scale and serve thousands of users.

### 🎯 Target Users

- **Students** learning new skills through courses and mentorship
- **Instructors** creating and monetizing course content
- **Mentors** offering 1-on-1 guidance sessions
- **Companies** providing employee training solutions

### 💰 Business Model

- **Freemium subscription tiers** with different feature levels
- **Course marketplace** with revenue sharing for instructors
- **Paid mentorship sessions** with expert instructors
- **Premium features** and virtual currency system

---

## ✨ Features

### 🎓 Core Learning Features
- **Course Management** - Video courses with HLS streaming, progress tracking, quizzes, and assignments
- **Interactive Video Player** - Bookmarks, notes, playback sessions, video analytics, and heatmaps
- **Live Sessions** - WebRTC video conferencing with screen sharing, recording, and real-time chat
- **Progress Tracking** - Detailed learning analytics and completion certificates
- **Quizzes & Assessments** - Built-in assessment tools with automatic grading

### 🤝 Community & Collaboration
- **Discussion Forums** - Threaded discussions with voting, best answers, and tags
- **Real-time Messaging** - Direct messages, group conversations, typing indicators
- **Study Groups** - Collaborative learning spaces with public/private options
- **Mentorship** - 1-on-1 mentoring sessions with expert instructors

### 🎮 Gamification & Engagement
- **XP System** - Points-based progression with level advancement
- **Achievements & Badges** - Unlockable achievements and badge collection
- **Leaderboards** - Daily, weekly, and all-time rankings
- **Team Challenges** - Collaborative challenges with seasonal events
- **Virtual Currency** - In-platform currency for rewards and premium features
- **Reward Shop** - Exchange earned currency for premium items

### 🤖 AI & Analytics
- **AI-Powered Recommendations** - Collaborative filtering and content-based course suggestions
- **Real-time Analytics** - Live metrics, user engagement tracking, and dashboards
- **Video Analytics** - Heatmaps, drop-off points, and playback statistics
- **Learning Analytics** - Detailed progress reports and performance insights

### 🔐 Security & Payments
- **Authentication** - JWT with refresh tokens, OAuth2 (Google, Facebook)
- **Two-Factor Authentication** - TOTP with authenticator apps and backup codes
- **Role-Based Access Control** - Student, Instructor, Admin roles
- **Subscription Management** - Stripe integration with multiple plans
- **Payment Processing** - Secure payment handling with invoices
- **Promotional Codes** - Discount code system for marketing

---

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Real-time**: Socket.io
- **Video Processing**: FFmpeg (HLS streaming)
- **Storage**: AWS S3
- **Authentication**: JWT, OAuth2, TOTP
- **Payments**: Stripe
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier

---

## 🏗 Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                        │
│                    Next.js 14 + React                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                           │
│                      NestJS + Express                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ PostgreSQL   │ │  Redis   │ │  AWS S3      │
│  (Prisma)    │ │ (Cache)  │ │  (Storage)   │
└──────────────┘ └──────────┘ └──────────────┘
```

### Backend Modules
```
backend/src/
├── auth/                    # Authentication & Authorization
├── courses/                 # Course management & video processing
├── live-sessions/           # WebRTC video conferencing
├── forums/                  # Discussion forums
├── messaging/               # Real-time messaging
├── gamification/            # Basic gamification (XP, badges)
├── advanced-gamification/   # Advanced gamification (teams, events)
├── mentorship/              # 1-on-1 mentoring
├── study-groups/            # Collaborative learning groups
├── certification/           # Exams & certificates
├── analytics/               # Learning analytics
├── realtime-analytics/      # Real-time metrics & dashboards
├── recommendations/         # AI-powered recommendations
├── video/                   # Interactive video features
├── two-factor/              # 2FA authentication
├── subscriptions/           # Payment & subscription management
└── prisma/                  # Database schema & migrations
```

### Frontend Structure
```
frontend/src/
├── app/                     # Next.js app router
│   ├── (auth)/             # Authentication pages
│   └── (dashboard)/        # Dashboard pages
├── components/             # Reusable components
│   ├── ui/                # UI components
│   ├── video/             # Video player components
│   └── providers.tsx      # Context providers
├── lib/                   # Utilities & API client
├── store/                 # State management
└── types/                 # TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- AWS S3 account (for video storage)
- Stripe account (for payments)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/grove.git
cd grove
```

2. **Start services with Docker**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api

For detailed setup instructions, see [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)

### Manual Setup (Without Docker)

See [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) for detailed manual setup instructions.

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[GETTING-STARTED.md](docs/GETTING-STARTED.md)** - Detailed setup and installation guide
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and technical details
- **[FEATURES.md](docs/FEATURES.md)** - Complete feature documentation
- **[PROJECT-SUMMARY.md](docs/PROJECT-SUMMARY.md)** - Project overview for hiring managers
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

### API Documentation

The backend includes comprehensive API documentation accessible at:
- **Swagger UI**: http://localhost:3000/api
- **OpenAPI Spec**: http://localhost:3000/api-json

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile

#### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (instructor/admin)

#### Gamification
- `GET /api/gamification/progress` - Get user XP progress
- `GET /api/gamification/leaderboard` - Get leaderboard

#### Analytics
- `GET /api/analytics/realtime` - Get real-time metrics
- `GET /api/analytics/dashboard` - Get dashboard summary

#### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/subscribe` - Subscribe to plan

---

## 🗄 Database Schema

The platform uses PostgreSQL with Prisma ORM. Key tables include:

### Core Tables
- `users` - User accounts and profiles
- `courses` - Course information and metadata
- `lessons` - Individual lessons within courses
- `enrollments` - User course enrollments
- `certificates` - Completion certificates

### Social Tables
- `forums` - Forum categories
- `threads` - Discussion threads
- `posts` - Forum posts and replies
- `conversations` - Messaging conversations
- `messages` - Individual messages

### Gamification Tables
- `user_progress` - XP and level progression
- `achievements` - Achievement definitions
- `user_achievements` - User achievement unlocks
- `teams` - Gamification teams
- `challenges` - Team challenges

### Payment Tables
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User subscriptions
- `payments` - Payment records
- `invoices` - Billing invoices

**Total**: 100+ database tables

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **OAuth2 Integration** - Google and Facebook login
- **Two-Factor Authentication** - TOTP with backup codes
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - API request rate limiting
- **CORS Configuration** - Cross-origin resource sharing
- **Input Validation** - Comprehensive validation with class-validator
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - Helmet.js security headers

---

## 📊 Performance Optimizations

- **Redis Caching** - Frequently accessed data cached
- **Database Indexing** - Optimized queries with proper indexes
- **Lazy Loading** - Components loaded on demand
- **Image Optimization** - Next.js automatic image optimization
- **Video Streaming** - HLS adaptive bitrate streaming
- **Code Splitting** - Automatic code splitting by Next.js
- **CDN Integration** - Static assets served via CDN

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd frontend
npm run test
```

---

## 📈 Monitoring & Analytics

- **Real-time User Tracking** - Live user sessions and activity
- **Course Performance** - Enrollment, completion, and engagement metrics
- **User Behavior** - Click tracking, time spent, interaction patterns
- **System Health** - API response times, error rates, server load

---

## 🚢 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Environment Variables
Required environment variables are documented in `.env.example` files.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer**: [Your Name]
- **Project**: Grove Social Learning Platform
- **Version**: 1.0.0

---

## 🙏 Acknowledgments

- NestJS framework and community
- Next.js team
- Prisma team
- Open source contributors

---

## 📞 Support

For support, email support@grove.com or open an issue in the repository.

---

<div align="center">

**Built with ❤️ for the global learning community**

[⬆ Back to Top](#-grove---social-learning-platform)

</div>