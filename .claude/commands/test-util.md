# Test Util Command

You are tasked with creating comprehensive unit tests for a utility function in the KlavHub dog parks codebase.

## Instructions

1. **Analyze the util file**: Read and understand the utility function(s) provided
2. **Create comprehensive tests**: Generate thorough unit tests covering:
   - Happy path scenarios
   - Edge cases (empty inputs, null/undefined values, boundary values)
   - Error handling and invalid inputs
   - Different input types and combinations
   - Return value validation
   - Performance considerations (if applicable)

## Test Standards

### Framework & Imports
Use Vitest with the following standard imports:
```typescript
import { describe, it, expect } from 'vitest';
```

### Test Structure
- Use `describe` blocks to group related tests
- Use descriptive test names that explain the scenario
- Include both positive and negative test cases
- Test boundary conditions and edge cases

### Assertions
- Use appropriate Vitest matchers (toBe, toEqual, toBeCloseTo, toThrow, etc.)
- For floating point numbers, use `toBeCloseTo()` with appropriate precision
- Test both return values and side effects
- Validate error messages when testing error cases

### Coverage Areas
Ensure tests cover:
1. **Happy Path**: Normal, expected usage
2. **Edge Cases**: Boundary values, empty/null inputs
3. **Error Handling**: Invalid inputs, throwing errors
4. **Type Safety**: Different input types (if applicable)
5. **Performance**: Large inputs (if applicable)
6. **Dependencies**: Mock external dependencies if present

### Example Patterns from Existing Tests

Based on the existing test files in the codebase:

```typescript
// Testing return values
expect(getSum([1, 2, 3])).toBe(6);

// Testing edge cases
expect(getSum([])).toBe(0);
expect(getMean([])).toBeNaN();

// Testing with precision
expect(getSTD([1, 2, 3])).toBeCloseTo(0.666666, 5);

// Testing string patterns
expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);

// Testing object properties
expect(age.unit).toBe('years');
expect(age.diff).toBe(2);
```

## Output Format

Create a complete test file with:
1. Proper imports
2. Describe blocks for each function
3. Multiple test cases per function
4. Clear, descriptive test names
5. Comprehensive coverage of scenarios

The test file should be ready to save as `{utilName}.test.ts` and run with `npm test`.

## Process

1. Read the provided util file
2. Identify all exported functions
3. Analyze function signatures, parameters, and return types
4. Generate test cases covering all scenarios
5. Ensure tests follow the project's existing patterns
6. Include helpful comments for complex test scenarios