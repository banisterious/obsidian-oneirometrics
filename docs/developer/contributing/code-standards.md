# Code Style Guide

## Overview

This document establishes guidelines for code formatting, naming conventions, and best practices to ensure a consistent, readable, and maintainable codebase for the OneiroMetrics Obsidian plugin.

## Table of Contents

- [1. General Linting Principles](#1-general-linting-principles)
- [2. TypeScript and JavaScript](#2-typescript-and-javascript)
  - [2.1. Formatting](#21-formatting)
  - [2.2. Naming Conventions](#22-naming-conventions)
  - [2.3. Best Practices](#23-best-practices)
  - [2.4. Commenting](#24-commenting)
- [3. CSS](#3-css)
  - [3.1. Formatting](#31-formatting)
  - [3.2. Naming Conventions](#32-naming-conventions)
  - [3.3. Best Practices](#33-best-practices)
  - [3.4. Commenting](#34-commenting)
- [4. Tool Configuration](#4-tool-configuration)
- [5. Enforcement](#5-enforcement)

## 1. General Linting Principles

### 1.1. Consistency

- Maintain consistent code style throughout the project.
- Inconsistencies can lead to confusion and increase the cognitive load for developers.

### 1.2. Readability

- Prioritize code that is easy to read and understand.
- Clear code reduces the likelihood of errors and makes maintenance easier.

### 1.3. Automation

- Rely on automated linting tools to enforce these guidelines.
- Automated enforcement ensures consistency and reduces subjective style debates.

### 1.4. Error Prevention

- Use linting to catch potential errors and bugs early in the development process.
- This includes syntax errors, logical errors, and violations of best practices.

## 2. TypeScript and JavaScript

### 2.1. Formatting

- Code should be compatible with ECMAScript 2018 syntax.

- **Indentation:**
  - Use 4 spaces for indentation.
  - Do not use tabs.
- **Spacing:**
  - Use consistent spacing around operators (`=`, `+`, `-`, etc.).
  - Add spaces after commas in lists or function arguments.
  - Add a space before the opening curly brace in code blocks.
- **Line Length:**
  - Aim for a maximum line length of 120 characters.
  - Break lines appropriately to improve readability.
- **Quotes:**
  - Use double quotes (`"`) for strings.
- **Semicolons:**
  - Use semicolons at the end of statements.
- **Trailing Commas:**
  - Use trailing commas in multiline arrays, objects, and function parameter lists.

### 2.2. Naming Conventions

- **Variables:**
  - Use `camelCase` for variable names (e.g., `myVariable`, `calculateTotal`).
- **Functions:**
  - Use `camelCase` for function names (e.g., `getUserData`, `renderTable`).
- **Classes:**
  - Use `PascalCase` for class names (e.g., `MyClass`, `DataManager`).
- **Interfaces/Types (TypeScript):**
  - Use `PascalCase` for interface and type names (e.g., `UserData`, `TableOptions`).
- **Type Guards:**
  - Prefix type guard functions with `is` (e.g., `isMetric`, `isValidSettings`).
- **Adapter Functions:**
  - Prefix adapter functions with `adaptTo` or `convertTo` (e.g., `adaptToCoreDreamMetricsSettings`).
- **Helper Utilities:**
  - Use descriptive verbs that indicate the action being performed (e.g., `getProjectNotePath`, `calculateMetricAverage`).

### 2.3. TypeScript Best Practices

> **Note:** For comprehensive TypeScript guidelines, refer to our detailed guides:
> - [TypeScript Best Practices](../implementation/typescript-best-practices.md)
> - [TypeScript Adapter Patterns](../implementation/typescript-adapter-patterns.md)
> - [TypeScript Helper Utilities](../implementation/typescript-helper-utilities.md)

#### Type Safety

- **Use Explicit Types:**
  - Always use explicit type annotations for function parameters and return types.
  - Avoid implicit typing whenever possible.

- **Avoid `any` Type:**
  - Avoid using the `any` type whenever possible.
  - Use `unknown` for values of uncertain type, then validate and narrow the type.
  - Be explicit with type annotations to improve code clarity and catch type-related errors.

- **Use Type Guards:**
  - Create and use type guards to validate object shapes at runtime.
  - Use type predicates (`param is Type`) for proper type narrowing.

#### Interface Design

- **Design for Evolution:**
  - Create interfaces that can evolve over time through extension.
  - Use inheritance to build upon base interfaces.

- **Use Optional Properties Carefully:**
  - Only mark properties as optional when they are truly optional.
  - Consider the implications of optional properties on type safety.

- **Use Readonly for Immutable Data:**
  - Mark properties that shouldn't be modified as `readonly`.

#### Safe Property Access

- **Use Safe Access Patterns:**
  - Implement helper functions for accessing potentially undefined properties.
  - Use optional chaining (`?.`) and nullish coalescing (`??`) operators.
  - Handle edge cases explicitly.

#### Adapter Pattern

- **Implement Strong Adapters:**
  - Use adapter functions to convert between different interface versions.
  - Design adapters to handle missing or renamed properties.
  - Ensure adapters provide sensible defaults for missing data.

#### Error Handling

- **Use Context-Enriched Errors:**
  - Enrich errors with context information as they bubble up.
  - Implement a consistent error handling approach across the codebase.
  - Consider using the Result pattern for recoverable errors.

#### Variable Declarations

- **`const` and `let`:**
  - Use `const` for variables that will not be reassigned.
  - Use `let` for variables that will be reassigned.
  - Avoid using `var`.

#### Component Architecture

- **Follow Component Patterns:**
  - Use consistent patterns for UI component implementation.
  - Implement proper lifecycle methods and cleanup.
  - Ensure event handlers are properly cleaned up to prevent memory leaks.

### 2.4. Commenting

- **Purpose:**
  - Use comments to explain complex logic, non-obvious code, and the purpose of functions or classes.
  - Comments should provide context and improve code understanding.
- **Types of Comments:**
  - Use single-line comments (`//`) for short explanations.
  - Use multi-line comments (`/* ... */`) for longer explanations or to comment out blocks of code.
  - Use JSDoc-style comments (`/** ... */`) for function and class documentation (especially in TypeScript).
- **Clarity and Conciseness:**
  - Write clear and concise comments.
  - Avoid stating the obvious (e.g., `i = i + 1; // Increment i`).
  - Focus on explaining *why* the code is written, not just *what* it does.
- **Maintenance:**
  - Keep comments up-to-date with code changes.
  - Remove or update comments that are no longer accurate.
- **Examples:**

  ```typescript
  // This function calculates the total price of the items in the cart.
  function calculateTotalPrice(cart: Item[]): number {
      let total = 0;
      for (const item of cart) {
          total += item.price;
      }
      return total;
  }

  /**
   * Represents a user with a name and email address.
   * @interface
   */
  interface User {
      name: string;
      email: string;
  }
  ```

## 3. CSS

> **Note:** A comprehensive CSS refactoring plan is available in the CSS refactoring documentation that will improve code organization and maintainability.

### 3.1. Formatting

- **Indentation:**
  - Use 4 spaces for indentation.
  - Do not use tabs.
- **Spacing:**
  - Add a space before the opening curly brace in rulesets.
  - Use consistent spacing between properties and values.
  - Use a newline after each property declaration.
- **Line Length:**
  - Keep lines reasonably short for readability.
- **Quotes:**
  - Use double quotes (`"`) where required (e.g., in `url()` functions).
- **Semicolons:**
  - Use semicolons at the end of property declarations.

### 3.2. Naming Conventions

- **Classes:**
  - Use `kebab-case` for CSS class names (e.g., `my-element`, `content-header`).
  - Use meaningful and descriptive class names.
  - The CSS uses "oom-" prefix for all plugin-specific classes to avoid conflicts.
- **IDs:**
  - Avoid using IDs whenever possible.
  - If IDs are necessary, use `camelCase` or `kebab-case`.

### 3.3. Best Practices

- **CSS Variables:**
  - Use CSS variables (`--my-variable`) for colors, fonts, and other reusable values.
  - This improves maintainability and theme compatibility (as seen in `styles.css`).
- **Specificity:**
  - Keep CSS specificity as low as possible.
  - Avoid overly complex selectors.
- **`!important`:**
  - Avoid using `!important` whenever possible.
  - Use it sparingly and only when absolutely necessary.
- **CSS Architecture:**
  - Follow a component-based approach with clear naming and organization.
  - Maintain modularity and prevent conflicts.

### 3.4. Commenting

- **Purpose:**
  - Use comments to organize CSS code into sections.
  - Explain the purpose of specific CSS rules or selectors.
  - Document any browser-specific hacks or workarounds.
- **Formatting:**
  - Use multi-line comments (`/* ... */`) for all CSS comments.
  - Keep comments concise and informative.
- **Examples:**

  ```css
  /* ==========================================================================
     Global Styles
     ========================================================================== */

  body {
      font-family: sans-serif;
      line-height: 1.6;
  }

  /* Header Styles */
  .header {
      background-color: #f0f0f0;
      padding: 1em;
  }
  ```

## 4. Tool Configuration

- Linting configurations are managed by Cursor.
- Any custom configurations should be documented here as they are adopted.

## 5. Enforcement

- Linting is enforced automatically by Cursor during code generation and modification.
- Any linting errors should be addressed promptly.
- Pull requests should pass all linting checks before being approved. 