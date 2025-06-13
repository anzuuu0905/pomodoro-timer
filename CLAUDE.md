# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Preferences

- When presented with multiple options (1, 2, 3, etc.), automatically choose option 1 and proceed without asking for confirmation
- When multiple design approaches are possible, implement the first/simplest solution without asking
- When user requests changes or new features, implement them directly without presenting options
- Prioritize speed and efficiency over asking for clarification
- Default to creating new projects as Node.js/JavaScript unless specified otherwise
- Always run linting and type checking after making code changes
- Use TypeScript by default for new JavaScript projects
- Prefer functional programming patterns and modern ES6+ syntax
- Use async/await instead of promises when possible
- For UI/UX decisions, implement a clean and simple design without asking for preferences

## Code Style and Standards

- Use 2 spaces for indentation
- Use single quotes for strings
- Include semicolons
- Use descriptive variable and function names
- Add JSDoc comments for functions and classes
- Keep functions small and focused (max 20-30 lines)

## Error Handling

- Always handle errors properly with try/catch blocks
- Use meaningful error messages
- Log errors appropriately for debugging

## Testing Approach

- Write tests for all new functionality
- Use Jest as the default testing framework
- Include both unit tests and integration tests
- Aim for high test coverage (80%+)

## Git Workflow

- Use conventional commit messages (feat:, fix:, docs:, etc.)
- Create meaningful commit messages that explain the "why"
- Always run tests before committing

## Performance and Security

- Optimize for readability first, then performance
- Never commit sensitive information (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs

## Project Status

This is a new, empty repository. When starting development:
- Initialize as a Node.js project with `npm init -y`
- Set up TypeScript configuration
- Install development dependencies (ESLint, Prettier, Jest)
- Create standard project structure (src/, tests/, docs/)