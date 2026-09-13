# Contributing to APIScope

Thank you for your interest in improving APIScope. Follow these guidelines to submit bugs, propose improvements, or open pull requests.

## Development setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/alexandrmotologa/apiscope-extension.git
   cd apiscope-extension
   npm install
   ```

2. Start the local preview server:
   ```bash
   npm run dev:web
   ```

3. Run the test suite:
   ```bash
   npm test
   ```

4. Verify production builds:
   ```bash
   npm run build
   ```

## Workflow rules

- Write code and comments in clear English.
- Avoid unnecessary external runtime dependencies.
- Keep the security grading rules deterministic and backed by tests.
- When adding a new exporter or header audit rule, include corresponding unit test cases in `test/`.
- Ensure `npm run build` and `npm test` pass before committing.

## Submitting changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Commit your work with concise conventional messages (e.g. `feat: add permissions-policy audit rule`).
3. Push to your fork and open a pull request against `main`.
