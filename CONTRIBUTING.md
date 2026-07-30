# Contributing to Grove

Thank you for your interest in contributing to Grove! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that the bug is already known. When creating a bug report, please include:

- **Description**: A clear and concise description of the bug
- **Steps to Reproduce**: Steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots
- **Environment**: OS, browser, and version information
- **Additional Context**: Any other relevant information

### Suggesting Enhancements

Enhancement suggestions are welcomed! Please provide:

- **Description**: A clear and concise description of the enhancement
- **Motivation**: Why would this enhancement be useful?
- **Alternatives**: What alternatives have you considered?
- **Additional Context**: Any other relevant information

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for type safety
- **ESLint**: Follow ESLint rules
- **Prettier**: Use Prettier for code formatting
- **Naming Conventions**: Use meaningful variable and function names
- **Comments**: Add comments for complex logic

### Backend Guidelines

- **NestJS Patterns**: Follow NestJS best practices
- **Service Layer**: Keep business logic in services
- **Validation**: Use class-validator for input validation
- **Error Handling**: Implement proper error handling
- **Database**: Use Prisma for database operations

### Frontend Guidelines

- **React Best Practices**: Follow React best practices
- **Component Design**: Create reusable components
- **State Management**: Use Zustand for global state
- **API Calls**: Use TanStack Query for API calls
- **Styling**: Use Tailwind CSS for styling

### Testing

- **Unit Tests**: Write unit tests for functions and components
- **Integration Tests**: Write integration tests for API endpoints
- **E2E Tests**: Write E2E tests for critical user flows
- **Test Coverage**: Maintain good test coverage

## 🏗️ Project Structure

```
grove/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── courses/       # Course management
│   │   ├── forums/        # Discussion forums
│   │   ├── messaging/     # Real-time messaging
│   │   ├── gamification/  # Gamification system
│   │   └── ...
│   ├── prisma/            # Database schema
│   └── package.json
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities
│   │   └── store/        # State management
│   └── package.json
├── docs/                 # Documentation
├── .github/              # GitHub workflows
└── README.md
```

## 🧪 Testing

### Running Tests

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

### Writing Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user flows

## 📝 Documentation

- **README.md**: Keep the main README updated
- **API Documentation**: Update API documentation for new endpoints
- **Code Comments**: Add comments for complex logic
- **Changelog**: Update CHANGELOG.md for significant changes

## 🔄 Git Workflow

### Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test updates

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

Example:
```
feat(auth): add two-factor authentication

Add TOTP-based two-factor authentication with QR code setup
and backup codes for account recovery.
```

## 🚀 Deployment

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update environment variables
3. Run database migrations
4. Start development servers

### Production Deployment

- Use Docker for containerization
- Follow CI/CD pipeline
- Test in staging environment
- Deploy to production with monitoring

## 📊 Code Review Process

1. **Self-Review**: Review your own changes
2. **Tests**: Ensure all tests pass
3. **Documentation**: Update relevant documentation
4. **Submit PR**: Create a pull request
5. **Review**: Address review feedback
6. **Merge**: Merge after approval

## 🎯 Priority Guidelines

- **Critical**: Security issues, data loss, production outages
- **High**: Important features, significant bugs
- **Medium**: Nice-to-have features, minor bugs
- **Low**: Minor improvements, documentation

## 📜 License

By contributing to Grove, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the project's contributor list and changelog.

## 📞 Contact

For questions about contributing, please open an issue or contact the maintainers.

---

Thank you for contributing to Grove! 🎉