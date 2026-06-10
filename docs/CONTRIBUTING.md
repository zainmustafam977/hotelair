# Contributing Guide

Thank you for your interest in contributing to HotelAir! This guide provides detailed instructions for contributing code, reporting issues, and improving the project.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Testing Procedures](#testing-procedures)
6. [Pull Request Process](#pull-request-process)
7. [Reporting Bugs](#reporting-bugs)
8. [Suggesting Features](#suggesting-features)
9. [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- **Be Respectful**: Treat all community members with respect and professionalism
- **Be Inclusive**: Welcome and support people of all backgrounds
- **Be Constructive**: Provide helpful feedback and criticism
- **Be Patient**: Understand that not everyone has the same experience level
- **Be Collaborative**: Work together toward common goals

### Unacceptable Behavior

The following behaviors are unacceptable:
- Harassment, discrimination, or offensive language
- Intentional disruption of discussions
- Publishing private information without consent
- Any form of abuse or bullying

**Report violations** to zainmustafam041@gmail.com

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- Git
- PostgreSQL (for database work)
- Familiarity with JavaScript/ES6+

### Setup Development Environment

1. **Fork the Repository**
   ```bash
   Click "Fork" button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hotelair.git
   cd hotelair
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/zainmustafam977/hotelair.git
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/`: New features (e.g., `feature/room-filters`)
- `bugfix/`: Bug fixes (e.g., `bugfix/booking-validation`)
- `docs/`: Documentation updates (e.g., `docs/api-guide`)
- `refactor/`: Code refactoring (e.g., `refactor/auth-module`)
- `test/`: Tests and test infrastructure (e.g., `test/booking-suite`)

### 2. Make Your Changes

```bash
# Make your changes to the codebase
# Test locally
npm run dev
npm test
```

### 3. Keep Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch
git rebase upstream/main
```

### 4. Commit Your Work

```bash
git add .
git commit -m "feat: add room filter functionality"
```

See [Commit Message Guidelines](#commit-message-guidelines) for format.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Go to GitHub and create a pull request from your fork to the main repository.

## Code Style Guidelines

### JavaScript/Node.js

#### Formatting
```javascript
// ✅ Good
function calculateBookingPrice(checkInDate, checkOutDate, roomPrice) {
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  return nights * roomPrice;
}

// ❌ Bad
function calculateBookingPrice(checkInDate,checkOutDate,roomPrice){
let nights=Math.ceil((checkOutDate-checkInDate)/(1000*60*60*24));
return nights*roomPrice;}
```

#### Naming Conventions
```javascript
// Constants - UPPER_CASE
const MAX_ROOM_CAPACITY = 10;
const DB_CONNECTION_TIMEOUT = 5000;

// Classes - PascalCase
class BookingManager {
  constructor() {}
}

// Functions and variables - camelCase
function processBookingPayment() {}
const bookingPrice = 250;

// Private methods - prefix with underscore
class Room {
  _validateRoomNumber() {}
}
```

#### File Structure
```
src/
├── controllers/     # Route handlers
├── models/         # Database models
├── middleware/     # Express middleware
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── config/         # Configuration files
```

#### Comments
```javascript
// ✅ Good - Clear and concise
// Calculate total price for booking period
const totalPrice = nights * roomPrice;

// ✅ Good - Explaining why, not what
// We use this specific timeout because some rooms take longer to load during peak hours
const LOAD_TIMEOUT = 10000;

// ❌ Bad - Obvious comment
// Set the name to John
const name = 'John';
```

#### Error Handling
```javascript
// ✅ Good
try {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new Error('Booking not found');
  }
  return booking;
} catch (error) {
  logger.error('Error fetching booking:', error);
  throw error;
}

// ❌ Bad
const booking = Booking.findById(id); // No error handling
```

### HTML/CSS

#### HTML Best Practices
```html
<!-- ✅ Good - Semantic HTML -->
<section class="room-list">
  <article class="room-card">
    <header>
      <h2>Room 101</h2>
    </header>
    <p>Double bed room with ocean view</p>
  </article>
</section>

<!-- ❌ Bad - Non-semantic -->
<div class="room-list">
  <div class="room-card">
    <div><b>Room 101</b></div>
    <div>Double bed room with ocean view</div>
  </div>
</div>
```

#### CSS Organization
```css
/* ✅ Good - BEM naming convention */
.room-card {
  border: 1px solid #ddd;
  padding: 20px;
}

.room-card__title {
  font-size: 18px;
  font-weight: bold;
}

.room-card--featured {
  border: 2px solid #ffd700;
}

/* ❌ Bad - Generic class names */
.card {
  border: 1px solid #ddd;
}

.card-title {
  font-size: 18px;
}
```

### Linting and Formatting

Run linting before committing:

```bash
# Run ESLint
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## Testing Procedures

### Writing Tests

Tests should cover:
- Happy path scenarios
- Edge cases
- Error conditions
- User interactions

```javascript
// ✅ Good test structure
describe('BookingService', () => {
  describe('calculatePrice', () => {
    it('should calculate correct price for multiple nights', () => {
      const price = calculatePrice(2, 100);
      expect(price).toBe(200);
    });

    it('should return 0 for 0 nights', () => {
      const price = calculatePrice(0, 100);
      expect(price).toBe(0);
    });

    it('should throw error for negative nights', () => {
      expect(() => calculatePrice(-1, 100)).toThrow();
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/booking.test.js
```

### Coverage Requirements

Aim for:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

```bash
npm run test:coverage
# View coverage report in coverage/index.html
```

## Pull Request Process

### Before Submitting

1. **Update Your Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   npm run dev  # Manual testing
   ```

3. **Update Documentation**
   - Update README if needed
   - Update API docs if endpoints changed
   - Add code comments for complex logic

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Added tests
- [ ] All tests passing
- [ ] Tested in development

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added and passing
```

### Review Process

1. **Code Review**: Team reviews for:
   - Code quality and style
   - Testing coverage
   - Documentation
   - Performance implications

2. **Feedback**: Respond promptly to feedback

3. **Revisions**: Make requested changes in new commits

4. **Approval**: Requires approval from at least 2 maintainers

5. **Merge**: Maintainer merges PR

### After Merge

Delete your feature branch:

```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Reporting Bugs

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 14.x

## Screenshots
If applicable, add screenshots

## Additional Context
Any other context
```

### Best Practices for Bug Reports

- Search existing issues first
- Provide minimal reproducible example
- Include error messages and stack traces
- Be specific about browser and OS
- Separate unrelated issues into different reports

## Suggesting Features

### Feature Request Template

```markdown
## Description
Clear description of the feature

## Problem It Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternative Solutions
Other possible approaches

## Additional Context
Benefits, use cases, etc.
```

### Feature Request Guidelines

- Check if feature already exists
- Explain use case clearly
- Consider backwards compatibility
- Provide mockups/examples if helpful

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```
feat(rooms): add room filtering by amenities

Allow users to filter rooms by selected amenities
when searching for available rooms.

Closes #456
```

```
fix(booking): correct date validation in checkout

The checkout date validation was not accounting for
timezone differences, causing valid bookings to fail.

Fixes #789
```

### Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build/dependency changes

### Scope

Component or module affected (optional):
- `auth`, `rooms`, `bookings`, `staff`, `analytics`, `payments`

### Subject

- Imperative mood: "add" not "added"
- Don't capitalize first letter
- No period at end
- Max 50 characters

### Body

- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple changes

### Footer

Reference issues:
- `Closes #123`
- `Fixes #456`
- `Relates to #789`

## Getting Help

- **Issues**: Ask questions in GitHub Issues
- **Discussions**: Join [GitHub Discussions](https://github.com/zainmustafam977/hotelair/discussions)
- **Email**: zainmustafam041@gmail.com
- **Documentation**: Check [Getting Started](./GETTING_STARTED.md) and other docs

## License

By contributing to HotelAir, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to HotelAir! 🎉**

Your contributions make this project better for everyone.
