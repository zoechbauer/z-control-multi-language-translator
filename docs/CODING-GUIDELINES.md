# CODING GUIDELINES

_This document summarizes key best practices from **Clean Code** by Robert C. Martin._

## 1. Meaningful Names
- Use intention-revealing names.
- Avoid disinformation and misleading names.
- Use pronounceable and searchable names.
- Avoid using encodings or Hungarian notation.
- Use consistent naming conventions.
- Use nouns for classes and variables, verbs for methods.

## 2. Functions
- Keep functions small and focused on a single task.
- Prefer fewer arguments. Zero, one, or two arguments are ideal.
- Use descriptive names for functions.
- Function should do one thing and do it well.
- Avoid side effects.
- Use exceptions rather than returning error codes.
- Functions should have one level of abstraction.

## 3. Comments
- Comments should explain **why**, not **what**.
- Use comments to clarify intent or rationale, not to compensate for bad code.
- Avoid redundant and misleading comments.
- Use clear section headers and TODO comments for future improvements.

## 4. Formatting
- Use proper indentation and spacing to improve readability.
- Vertical spacing should be used to separate concepts.
- Code should be easy to scan.

## 5. Objects and Data Structures
- Encapsulate data; no public data members.
- Expose behavior through methods rather than through exposing data.
- Follow the Law of Demeter (principle of least knowledge).

## 6. Error Handling
- Use exceptions rather than error codes.
- Provide context when throwing exceptions.
- Handle errors at the appropriate level.
- Avoid empty catch blocks.

## 7. Boundaries
- Isolate third-party code behind interfaces.
- Create explicit boundaries and adapters around external systems.
- Keep dependencies manageable and well encapsulated.

## 8. Unit Tests
- Write clean, readable, and fast unit tests.
- Tests should be independent and repeatable.
- Use descriptive names for test methods.
- Follow the three A’s: Arrange, Act, Assert.
- Keep tests small and focused on a single behavior.
- Tests are part of the production code.

## 9. Classes
- Classes should be small and focused.
- Follow the Single Responsibility Principle (SRP): one class, one reason to change.
- Organize classes around concepts.
- Use descriptive and meaningful class names.
- Encapsulate details and hide complexity.

## 10. Code Smells and Refactoring
- Keep an eye out for duplicated code, long methods, large classes, and excessive comments.
- Refactor regularly to keep code clean.
- Use small, incremental changes.
- Don’t add functionality during refactoring.

## 11. Clean Code Attitude
- Prioritize readability and maintainability.
- Write code for humans first, computers second.
- Continuous learning and improvement.
- Embrace code reviews and constructive feedback.

---

**Remember:** Clean Code is more about discipline and mindset than about following a rigid checklist. Write code clearly, simply, and with the future reader in mind.

---

*Inspired by* [Clean Code by Robert C. Martin (Uncle Bob)].
