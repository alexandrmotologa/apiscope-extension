# Contributing to APIScope

Thank you for your interest in contributing to APIScope! We welcome contributions of all kinds, whether you are fixing a bug, improving documentation, or proposing new features.

---

## Code of Conduct

Please treat everyone in the community with respect, kindness, and constructive feedback. Open source thrives when developers collaborate positively.

---

## How to Contribute

### 1. Reporting Bugs & Requesting Features
- **Search existing issues** first to avoid duplicates.
- **For bugs:** Open an issue describing the bug, including steps to reproduce, expected vs. actual behavior, and environment details (OS, Chrome/Chromium version, Node.js version).
- **For feature requests:** Describe the problem you are trying to solve and propose an exporter, audit rule, or UI capability.

### 2. Pull Request Workflow

1. **Fork the repository** and clone locally:
   ```bash
   git clone https://github.com/alexandrmotologa/apiscope-extension.git
   # Or clone your personal fork if preparing a pull request:
   # git clone https://github.com/YOUR_USERNAME/apiscope-extension.git
   cd apiscope-extension
   ```

2. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or: git checkout -b fix/issue-description
   ```

3. **Follow commit conventions:** We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add permissions-policy audit rule to security engine`
   - `fix: resolve timing race condition in webRequest listener`
   - `docs: update Chrome Web Store installation guide in README`
   - `perf: optimize ring buffer indexing for high-frequency requests`

4. **Ensure code quality:**
   - Write code and comments in clear English.
   - Keep security grading rules deterministic and backed by tests.
   - Verify that all existing and new unit tests pass before submitting (`npm test`).
   - Run production builds to ensure Manifest V3 compliance (`npm run build`).

5. **Push and open a Pull Request:**
   - Push your branch to your fork:
     ```bash
     git push origin feat/your-feature-name
     ```
   - Open a Pull Request against the `main` branch.
   - Provide a clear PR title and description outlining the changes made and referencing any related issues (e.g., `Closes #12`).

---

## Development Setup

APIScope is built with TypeScript, React, and Tailwind CSS for Manifest V3 Chromium browsers.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local standalone preview server:**
   ```bash
   npm run dev:web
   ```

3. **Run automated test suite:**
   ```bash
   npm test
   ```

4. **Build production extension bundle:**
   ```bash
   npm run build
   ```

Refer to the **Quick Start** section in [README.md](README.md) for extension loading instructions in developer mode.

---

## Questions & Discussions

If you have questions about architecture decisions or need guidance before submitting a large change, feel free to open a Discussion or an Issue with the `question` label.
