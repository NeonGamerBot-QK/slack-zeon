# Agents Guide for slack-zeon

## Commands
- **Start**: `npm start` - Runs the bot with ts-node and increased memory
- **No build/lint/test**: No configured commands for builds, linting, or testing

## Architecture
- **TypeScript** Slack bot using **@slack/bolt** framework
- **Entry**: src/index.ts initializes app, databases, and cron jobs
- **Commands**: src/commands/ - Individual slash commands implementing the Command interface
- **Modules**: src/modules/ - Reusable functionality (cron jobs, utilities, integrations)
- **Databases**: PostgreSQL (via Keyv) for main data, Simple JSON DB for legacy data, encrypted DB for sensitive data (anondm)
- **Key modules**: slackapp.ts (app instance), BaseCommand.ts (command interface), cron.ts (scheduled tasks)

## Code Style
- **Imports**: Start with external packages, then local modules using relative paths
- **Types**: Use TypeScript interfaces exported at top of modules; strict mode disabled
- **Classes**: Command pattern for slash commands - implement Command interface with name, description, run()
- **Functions**: Export standalone utility functions; use async/await for promises
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces/types
- **Error handling**: Sentry integration for monitoring; use try-catch where appropriate
- **Comments**: Minimal - code should be self-documenting; use TODO comments for deferred work
