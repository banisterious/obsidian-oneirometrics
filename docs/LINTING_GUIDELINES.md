#   Linting and Code Style Guide

##   1.  Introduction

###   1.1. Purpose

-   This document establishes guidelines for code formatting, naming conventions, and best practices to ensure a consistent, readable, and maintainable codebase for the OneiroMetrics Obsidian plugin.
-   Adhering to these guidelines will improve collaboration, reduce errors, and streamline development.

###   1.2. Scope

-   These guidelines apply to:
    -   TypeScript (`.ts` files)
    -   JavaScript (`.js` files)
    -   CSS (`.css` files)

###   1.3. Linting Tools

-   While the specific configuration is handled by Cursor, the project utilizes ESLint for JavaScript and TypeScript, and Stylelint for CSS.

##   2.  General Linting Principles

###   2.1. Consistency

-   Maintain consistent code style throughout the project.
-   Inconsistencies can lead to confusion and increase the cognitive load for developers.

###   2.2. Readability

-   Prioritize code that is easy to read and understand.
-   Clear code reduces the likelihood of errors and makes maintenance easier.

###   2.3. Automation

-   Rely on automated linting tools to enforce these guidelines.
-   Automated enforcement ensures consistency and reduces subjective style debates.

###   2.4. Error Prevention

-   Use linting to catch potential errors and bugs early in the development process.
-   This includes syntax errors, logical errors, and violations of best practices.

##   3.  Specific Linting Rules

###   3.1. TypeScript and JavaScript

####   3.1.1. Formatting

-   Code should be compatible with ECMAScript 2018 syntax.

-   **Indentation:**
    -   Use 4 spaces for indentation.
    -   Do not use tabs.
-   **Spacing:**
    -   Use consistent spacing around operators (`=`, `+`, `-`, etc.).
    -   Add spaces after commas in lists or function arguments.
    -   Add a space before the opening curly brace in code blocks.
-   **Line Length:**
    -   Aim for a maximum line length of 120 characters.
    -   Break lines appropriately to improve readability.
-   **Quotes:**
    -   Use double quotes (`"`) for strings.
-   **Semicolons:**
    -   Use semicolons at the end of statements.
-   **Trailing Commas:**
    -   Use trailing commas in multiline arrays, objects, and function parameter lists.

####   3.1.2. Naming Conventions

-   **Variables:**
    -   Use `camelCase` for variable names (e.g., `myVariable`, `calculateTotal`).
-   **Functions:**
    -   Use `camelCase` for function names (e.g., `getUserData`, `renderTable`).
-   **Classes:**
    -   Use `PascalCase` for class names (e.g., `MyClass`, `DataManager`).
-   **Interfaces/Types (TypeScript):**
    -   Use `PascalCase` for interface and type names (e.g., `UserData`, `TableOptions`).

####   3.1.3. Best Practices

-   **`any` Type (TypeScript):**
    -   Avoid using the `any` type whenever possible.
    -   Be explicit with type annotations to improve code clarity and catch type-related errors.
-   **`const` and `let` (TypeScript/JavaScript):**
    -   Use `const` for variables that will not be reassigned.
    -   Use `let` for variables that will be reassigned.
    -   Avoid using `var`.
-   **Error Handling:**
    -   Use `try...catch` blocks for error handling.
    -   Log errors appropriately.
    -   Provide informative error messages.
-   **Code Organization:**
    -   Organize code into modular components.
    -   Use clear file and folder structure.
    -   Write comments to explain complex logic.

####   3.1.4. Commenting

-   **Purpose:**
    -   Use comments to explain complex logic, non-obvious code, and the purpose of functions or classes.
    -   Comments should provide context and improve code understanding.
-   **Types of Comments:**
    -   Use single-line comments (`//`) for short explanations.
    -   Use multi-line comments (`/* ... */`) for longer explanations or to comment out blocks of code.
    -   Use JSDoc-style comments (`/** ... */`) for function and class documentation (especially in TypeScript).
-   **Clarity and Conciseness:**
    -   Write clear and concise comments.
    -   Avoid stating the obvious (e.g., `i = i + 1; // Increment i`).
    -   Focus on explaining *why* the code is written, not just *what* it does.
-   **Maintenance:**
    -   Keep comments up-to-date with code changes.
    -   Remove or update comments that are no longer accurate.
-   **Examples:**

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

###   3.2. CSS

> **Note:** A comprehensive CSS refactoring plan is available in [CSS_REFACTORING.md](../CSS_REFACTORING.md) that will improve code organization and maintainability.

####   3.2.1. Formatting

-   **Indentation:**
    -   Use 4 spaces for indentation.
    -   Do not use tabs.
-   **Spacing:**
    -   Add a space before the opening curly brace in rulesets.
    -   Use consistent spacing between properties and values.
    -   Use a newline after each property declaration.
-   **Line Length:**
    -   Keep lines reasonably short for readability.
-   **Quotes:**
    -   Use double quotes (`"`) where required (e.g., in `url()` functions).
-   **Semicolons:**
    -   Use semicolons at the end of property declarations.

####   3.2.2. Naming Conventions

-   **Classes:**
    -   Use `kebab-case` for CSS class names (e.g., `my-element`, `content-header`).
    -   Use meaningful and descriptive class names.
-   **IDs:**
    -   Avoid using IDs whenever possible.
    -   If IDs are necessary, use `camelCase` or `kebab-case`.

####   3.2.3. Best Practices

-   **CSS Variables:**
    -   Use CSS variables (`--my-variable`) for colors, fonts, and other reusable values.
    -   This improves maintainability and theme compatibility (as seen in `styles.css`).
-   **Specificity:**
    -   Keep CSS specificity as low as possible.
    -   Avoid overly complex selectors.
-   **`!important`:**
    -   Avoid using `!important` whenever possible.
    -   Use it sparingly and only when absolutely necessary.
-   **CSS Architecture:**
    -   The CSS in `styles.css` demonstrates a component-based approach with clear naming and organization.
    -   Follow this pattern to maintain modularity and prevent conflicts.

####   3.2.4. Commenting

-   **Purpose:**
    -   Use comments to organize CSS code into sections.
    -   Explain the purpose of specific CSS rules or selectors.
    -   Document any browser-specific hacks or workarounds.
-   **Formatting:**
    -   Use multi-line comments (`/* ... */`) for all CSS comments.
    -   Keep comments concise and informative.
-   **Examples:**

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

##   4.  Tool Configuration

-   (This section will be expanded as needed if specific configurations are required beyond what Cursor handles.)

##   5.  Enforcement

-   Linting is enforced automatically by Cursor during code generation and modification.
-   Any linting errors should be addressed promptly.

##   6.  Examples

-   (This section will be expanded with "Before" and "After" code examples.)

##   7.  Resources

-   ESLint: \[Link to ESLint documentation]
-   Prettier: \[Link to Prettier documentation]
-   Stylelint: \[Link to Stylelint documentation]

## Styling Guidelines

For comprehensive styling guidelines and theme integration details, see the [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md).