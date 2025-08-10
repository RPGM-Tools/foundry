
This document outlines the conventions and commands for working in this repository.

## Build and Lint

**Note: Linting is performed during the build process automatically.**

- **Build all packages:** `npm run build`
- **Lint all packages:** `npm run lint`

## Repository Structure

This repository follows a monorepo structure with shared code and module-specific code:

### Shared Code (`/shared`)
- Contains common functionality used across all RPGM modules
- Includes shared UI components, utilities, and core systems
- Houses the base `RpgmModule` class that all modules extend
- Contains shared internationalization (i18n) files and type definitions
- Shared settings and configurations that apply to all modules

### Module Code (`/modules/*`)
- Each module has its own directory under `/modules`
- Modules can extend shared functionality or implement their own features
- Module-specific code and components
- Module-specific internationalization (i18n) files
- Each module follows the same build process and structure

## Internationalization (i18n) and Type Checking

The project implements a custom i18n type checking system to ensure type safety for localized strings:

### Shared i18n
- Located in `/shared/lang/` and `/shared/types/lang.d.ts`
- Contains base language definitions used across all modules
- Defines the `RpgmI18n` interface for shared localization keys
- Provides common strings for settings, logging, and core functionality

### Module-Specific i18n
- Located in `/modules/[module-name]/lang/` and `/modules/[module-name]/types/lang.d.ts`
- Contains language definitions specific to each module
- Defines module-specific interfaces (e.g., `ForgeI18n`) that extend the base types
- Each module's language files are merged with shared definitions at build time

### Type Safety
- TypeScript declaration files ensure all i18n keys are type-checked
- The `RpgmI18nCombined` interface combines shared and module-specific types
- The `satisfies` operator ensures language objects conform to their respective interfaces

## Code Style and Conventions

- **TypeScript:** This project uses TypeScript with strict settings. Adhere to standard TypeScript best practices.
- **Linting:** We use `eslint` for linting. Run `npm run lint` to check for issues. (Also runs `vue-tsc` for base type checking.)
  - Do not attempt to run `eslint` or `vue-tsc` manually. Run `npm run lint` or `npm run build` instead.
- **Formatting:** Maintain consistent formatting. Use Prettier or a similar tool if available.
- **Imports:** Organize imports logically. Group imports from the same module.
- **Naming:** Use clear and descriptive names for variables, functions, and classes. Follow existing naming conventions.
- **Error Handling:** Implement robust error handling. Use `try...catch` blocks or `then...catch` and handle potential errors gracefully.
- **Vue Components:** Follow Vue best practices for component structure, props, and events.
- **Documentation:** Write clear and concise comments where necessary. Document complex logic and public APIs.

## Chat Commands System

The Chat Commands system provides a framework for creating custom chat commands that can be executed by users in the chat interface. Commands are registered using the brigadier-ts-lite library which provides a Minecraft-like command syntax with argument parsing and autocompletion. Commands are prefixed with an asterisk (*) and can be registered by both the shared module and individual modules like rpgm-forge.

The system handles command registration, parsing, execution, and autocompletion automatically. Developers can create new commands by using the `literal`, `argument`, and `string` functions from brigadier-ts-lite and registering them with `rpgm.chat.registerCommand()`.

### Command Registration

Commands are registered in the `registerSettings()` method of each module. The shared module registers global commands like `*help`, while individual modules register their specific commands.

Example from rpgm-forge:
```typescript
rpgm.chat.registerCommand(literal("name")
  .then(argument("prompt", string("greedy_phrase")).executes(c => {
    void chatTokenNames(undefined, c.get<string>("prompt"));
  })).executes(() => {
    void chatTokenNames(undefined);
  }));
```

### Available Commands

The following commands are available in the system:

2. `*name [prompt]` - Generate names for tokens
3. `*description [type]` - Generate descriptions for tokens
4. `*homebrew [type]` - Generate custom homebrew content

### Integration with ChatWizards

Chat commands can create interactive interfaces using the ChatWizards system. For example, the `*homebrew` command creates a new ChatWizard message with an interactive interface for generating custom content.

## ChatWizards System

The ChatWizards system provides a framework for creating persistent, interactive chat-based interfaces within Foundry VTT. Each wizard is a specialized chat message that maintains its own state and can be interacted with through custom Vue components. Wizards are saved to world settings and are user-specific, allowing for persistent workflows across sessions. The system handles message creation, rendering, state management, and cleanup automatically. Developers can create new wizards by extending the `ChatWizard` class and providing a Vue component for the interface. The system includes built-in debounced auto-saving, placeholder content for missing modules, and automatic cleanup of orphaned messages.
