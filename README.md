# passgen

![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)
![Next.js](https://img.shields.io/badge/Next.js-13-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![CI/CD](https://img.shields.io/github/actions/workflow/status/EF361/passgen/ci.yml?label=CI/CD)
![Code Coverage](https://img.shields.io/codecov/c/github/EF361/passgen?color=brightgreen)

## Executive Summary

`passgen` is a cryptographically secure password generator that leverages modern web standards to ensure high-quality randomization and strong security guarantees. Built with TypeScript and Next.js, it provides developers and users with a fast, accessible, and customizable solution for generating secure, bias-free passwords.

## Key Features

- ✅ **Cryptographically Strong Randomness**: Uses the Web Crypto API for robust entropy and defense against weak passwords.
- ✅ **Bias-Free Sampling**: Implements rejection sampling and a secure shuffle algorithm to eliminate modulo bias.
- ✅ **Character Class Enforcement**: Ensures at least one character from each selected class (uppercase, lowercase, numbers, and symbols).
- ✅ **Clipboard Security**: Includes optional clipboard clearing and timeout behavior with full browser compatibility documentation.
- ✅ **Property-Based Testing**: Validates password correctness and distribution using advanced statistical and property-based testing frameworks (e.g., Jest).
- ✅ **Continuous Integration**: Automated testing, linting, type checking, and production build validation with GitHub Actions.
- ✅ **Security Best Practices**: Adds Content Security Policy (CSP) headers, automated browser-level security tests, and OWASP-compliant practices.
- ✅ **User-Centric Design**: Built with React 18 and TailwindCSS for excellent UI/UX, accessibility, and customization.
- ✅ **Comprehensive Test Coverage**: Published coverage reports with 100% adherence to CI pipeline gates.
- ✅ **Future-Proof Architecture**: Clear migration paths for upgrades to newer versions of Next.js, TypeScript, and other dependencies.

## Architecture & Workflow

The `passgen` application is structured with a focus on modularity, security, and performance. Below is the high-level architecture of the system:

```mermaid
flowchart TD
    A["User Interaction (UI)"] -->|"Password Options Input"| B["React Components (Next.js)"]
    B["React Components (Next.js)"] -->|"Generate Password"| C["Password Generation Logic (TypeScript)"]
    C["Password Generation Logic (TypeScript)"] -->|"Uses"| D["Web Crypto API (Entropy)"]
    C["Password Generation Logic (TypeScript)"] -->|"Validation and Bias-Free Sampling"| E["Validation Module"]
    C["Password Generation Logic (TypeScript)"] -->|"Clipboard Management"| F["Clipboard API"]
    B["React Components (Next.js)"] -->|"UI Updates"| G["TailwindCSS Styling"]
    G["TailwindCSS Styling"] -->|"Ensures"| A["User Interaction (UI)"]
    C["Password Generation Logic (TypeScript)"] -->|"Tested With"| H["Automated Jest Tests"]
    H["Automated Jest Tests"] -->|"Includes"| I["Property-Based and Statistical Tests"]
```

## Tech Stack & Tools Breakdown

- **TypeScript 4.9**: Strongly typed programming for safer and maintainable code.
- **Next.js 13**: Server-rendered React framework for dynamic web applications.
- **React 18**: Component-based UI library for declarative and efficient user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI design.
- **Web Crypto API**: Provides cryptographically secure random values for password generation.
- **Jest**: Robust testing library for unit, integration, and property-based tests.
- **GitHub Actions**: CI/CD workflows for automated testing, linting, and deployment.

## Quickstart / Installation

Follow these steps to quickly set up and run `passgen`:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/EF361/passgen.git
   cd passgen
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to preview the app.

4. **Run tests and view coverage reports**:
   ```bash
   npm run test
   npm run coverage
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

   The optimized production build will be in the `out` directory.

6. **Lint and type-check the code**:
   ```bash
   npm run lint
   npm run type-check
   ```

## Contributions

Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on submitting issues, pull requests, or feature suggestions.

---

This project was architected by **Alicia Goh (EF361)**, leveraging advanced engineering principles to deliver a secure and future-proof solution. If you find this project valuable, feel free to star ⭐ the repository and share your feedback!