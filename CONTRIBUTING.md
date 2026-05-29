# Contributing to Lumpia

Thank you for your interest in contributing to Lumpia!

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

- Open an issue using the [bug report template](https://github.com/kafkade/lumpia/issues/new?template=bug_report.md)
- Include steps to reproduce, expected behavior, and actual behavior
- Include your VS Code version and OS

### Suggesting Features

- Open an issue using the [feature request template](https://github.com/kafkade/lumpia/issues/new?template=feature_request.md)
- Describe the use case and how it improves the wrapping experience

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Ensure all checks pass:
   ```sh
   npm run lint && npm run build && npm test
   ```
5. Submit a pull request with a clear description

### Security Vulnerabilities

If you discover a security vulnerability, **do not open a public issue**. Instead, please use GitHub's [private vulnerability reporting](https://github.com/kafkade/lumpia/security/advisories/new) feature.

## Development Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for the full development guide, including:

- Prerequisites and project structure
- Build, test, and debug workflows
- Release process

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `test:` — adding or updating tests
- `refactor:` — code restructuring without behavior change
- `chore:` — maintenance tasks (CI, dependencies, etc.)

## Architecture

See `docs/adr/` for Architecture Decision Records and `docs/ROADMAP.md` for the project roadmap.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
