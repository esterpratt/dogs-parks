We just implemented the feature described in the attached plan.

Please do a thorough code review:

1. Make sure that the plan was correctly implemented.
2. Look for any obvious bugs or issues in the code.
3. Look for subtle data alignment issues (e.g. expecting camelCase but getting snake_case).
4. Look for any over-engineering or files getting too large and needing refactoring
5. Look for any weird syntax or style that doesn't match other parts of the codebase
6. Look for any changes that could affect infrastracture
7. Consider empty, loading and error states
8. Are there any changes that needs security check?
9. Are there any hard coded string that should have been set as i18n?
10. Did we handle performance potential issues?
11. Did the code follows the rules and code standards of the app?
12. Is there any unused code or unused dependencies?

Document your findings in .cursor/docs/features/<N>\_REVIEW.md unless a different file name is specified.
