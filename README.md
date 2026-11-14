# Vanilla & Strawberry — AI Project Pack

This archive contains project-level AI rules and engineering documentation.

## Install
Extract the contents of this archive into the **root of your existing project** (the same directory that contains the root `package.json`, or where it will be created).

The expected result is:
- `AGENTS.md` at project root
- `docs/` at project root
- `.opencode/` at project root

If a file already exists, compare and merge it instead of blindly overwriting your existing work.

## Start the AI correctly
Open the **project root folder** in OpenCode/your coding agent—not `src/`, not `api/`, and not `docs/`.

First instruction to the AI:

> Read `AGENTS.md` completely and read the relevant files in `docs/`. Do not edit anything yet. Audit the existing repository and create `docs/PROJECT_AUDIT.md` plus an updated `docs/DEVELOPMENT_PLAN.md`. Preserve existing working code. Then implement the plan in small tested phases. The Laravel backend must remain inside `./api`, and all development commands must be coordinated from the root.

This pack contains instructions and documentation only; it does not contain the application source code or install dependencies.
