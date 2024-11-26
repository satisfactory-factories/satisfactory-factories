# Conventions
This document plans to illustrate the expectations set upon developers contributing to this project. It is intended for such conventions to be relatively lightweight and not overly restrictive, but to provide a baseline for how the project is structured and maintained.

## Language
All code is to be written in `TypeScript` unless there is a specific reason to use another language. This is to ensure that the codebase is consistent and that all developers can understand the codebase and sing from the same hymn sheet.

## Commit messages
This project is following the [Conventional Commits Standard](https://www.conventionalcommits.org/en/v1.0.0/#summary). This is to ensure that commit messages maintain a level of consistency describing:

1. What kind of change it is, e.g. new feature or bugfix
2. What component they affect
3. A brief description of the change

- `feat(web): Add new feature to the web component`
- `fix(parser): Fix bug in the parser component`
- `chore(repo): Update README.md`
- `docs(repo): Update conventions.md`
- `ci(repo): Update CI configuration`

See [Versioning](./versioning.md) on why this is important and why we use it in practice.

## Code standards
**ALL** code despite language is to be written in the following format:

- 2 **spaces** for indentation
- No trailing whitespace
- Must have LF line endings
- Must have a newline at the end of the file
- Must comply with the ESLint specifications (typescript)

To aid this, developers can run `pnpm lint` in any component which will run ESLint checks and fix them. You must do this before committing or the CI will block the PR via a status check.

## Branching naming strategy
There is none. We are not enforcing any form of branching naming strategy. Branch strategy itself is Trunk based, more info [in how we do releases](./how-do-we-release.md).

## Test standards
New code should ideally be covered by a test. Our testing tool of choice is [Vitest](https://vitest.dev/guide/) which is a drop in replacement for Jest tests. It is recommended we use this tool as it is faster and more lightweight than Jest, and the web project is built in Vite, which is super performant.

### How we determine what needs tests written
**`web`**:
Generally, tests for `.vue` files are not mandatory, however if you have the knowledge on how to test them, please do include them. You may be asked to write them on a case by case bsis. As of writing, tests in `web` correlate around the factory calculations and various other important parts of the system.

**`backend` / `parsing`**:
For TypeScript only components, tests are going to be **strongly** encouraged. 

Please do not be dismayed if you are asked to provide tests for your PR. Should a contributor have the time, they will try to help guide you writing them. Take this as a learning experience opportunity!
There are however some exceptions to this:

* Parser **MUST** be backed by tests. There is no excuse with this component as it is all TypeScript, no DOM manipulation, and is a perfect candidate for testing.
  * The parser is the most critical component of the project, and it is essential that it is tested to ensure that it is working correctly. It literally provides everything required for the calculations of the tool.
  * High 90's % code coverage is expected for the parsing tool.