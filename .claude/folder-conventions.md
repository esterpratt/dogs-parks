# Folder-Specific Code Conventions

This file defines specific coding standards and conventions for different folders in the project.

## src/components/

### File Naming

- Use PascalCase for component files (e.g., `UserProfile.tsx`)

### Component Structure

- Extract component props inside the component function
- Use clear variable names in all functions, including array methods
- Always use curly braces for if statements (no single-line)

### Styling

- Each component should have its own .module.scss file
- Use camelCase for className combinations in TSX files
- Use kebab-case convention in SCSS files

## src/services/

### File Structure

- Export in the end of a file. Do not export individaully every function
- Create all interfaces in the top of the file

### File Naming

- Use kebab-case for service files (e.g., `user-service.ts`)
- Group related operations in the same service file

### Function Structure

- Use descriptive function names that indicate the operation
- Use 'const' instead of 'function' to declare functions
- Use try-catch for every function
- In the catch, think hard about wether to throw an error or return something. Ask me if you are not sure. If there is a need to throw an error, use throwError from 'error.ts'. (e.g, `throwError(error)`)
- When requesting supabase, accept back the 'error', and throw it to the catch if there is an error. See existing functions for examples.

## src/hooks/

### File Naming

- Start with "use" prefix (e.g., `useUserData.ts`)
- Use camelCase for the rest of the name

## src/pages/

### File Naming

- Use PascalCase for page component files (e.g., `UserProfile.tsx`)
- Match the route name when possible

### Page Structure

- Keep pages lightweight - delegate logic to hooks and services
- Use lazy loading for route components

## src/types/

### File Naming

- Use CamelCase for type definition files (e.g., `UserTypes.ts`)
- Group related types in the same file

### Type Structure

- Use descriptive interface names with clear prefixes/suffixes
- Export all types individually (no default exports)

## src/utils/

### File Naming

- Use camelCase for utility files (e.g., `dateHelpers.ts`)
- Group related utilities in the same file

### Function Structure

- Export individual utility functions
- Include JSDoc comments for complex utilities
- Use pure functions when possible
