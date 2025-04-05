# Contributing to NestJS Vibe Coding Template

Thank you for considering contributing to this project! Your help is essential for making this template better for everyone.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report.

- Use the bug report template when creating issues
- Include as many details as possible
- Include steps to reproduce the issue
- Include information about your environment

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Use the feature request template when creating issues
- Include as many details as possible
- Explain why this enhancement would be useful

### Pull Requests

- Follow the [TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- Write [good commit messages](https://chris.beams.io/posts/git-commit/)
- Include tests for new features or bug fixes
- Update documentation for significant changes
- Ensure all tests pass before submitting your PR

## Development Workflow

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Write or update tests as needed
5. Run tests locally
6. Push your branch and submit a pull request
7. Wait for review and address any feedback

## Local Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/base-api-service.git

# Navigate to the project directory
cd base-api-service

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start dependencies
docker compose up -d

# Run database migrations
npx prisma db push

# Start the development server
pnpm start:dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

## Coding Standards

- Follow NestJS best practices
- Write clean, readable, and maintainable code
- Use meaningful variable and function names
- Add appropriate comments when necessary
- Follow the existing project structure

## Documentation

Please update the documentation when changing core functionality. This includes:

- README.md
- API documentation
- Code comments
- Module-specific documentation

Thank you for contributing!
