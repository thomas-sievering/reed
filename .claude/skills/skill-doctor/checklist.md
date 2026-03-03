# Skill Doctor — Full Checklist

## 1. Frontmatter validation

### Allowed fields (exhaustive list)

Only these fields are valid in SKILL.md frontmatter:

| Field                      | Type    | Notes                                           |
| :------------------------- | :------ | :---------------------------------------------- |
| `name`                     | string  | Lowercase letters, numbers, hyphens. Max 64 chars. |
| `description`              | string  | Recommended. Used for auto-invocation matching.  |
| `argument-hint`            | string  | Shown during autocomplete, e.g. `[issue-number]` |
| `disable-model-invocation` | boolean | `true` to prevent Claude from auto-invoking      |
| `user-invocable`           | boolean | `false` to hide from `/` menu                    |
| `allowed-tools`            | string  | Comma-separated tool list                        |
| `model`                    | string  | Model override when skill is active              |
| `context`                  | string  | `fork` to run in a subagent                      |
| `agent`                    | string  | Subagent type when `context: fork` is set        |
| `hooks`                    | object  | Hooks scoped to this skill's lifecycle           |

### Checks

- **ERROR** if any field not in the table above is present (common mistakes: `trigger`, `tags`, `category`, `version`, `author`, `invocation`, `tools`, `permissions`)
- **ERROR** if `name` contains uppercase letters, spaces, or special characters (only `[a-z0-9-]` allowed, max 64 chars)
- **ERROR** if `agent` is set but `context` is not `fork` — `agent` has no effect without `context: fork`
- **WARNING** if `description` is missing — Claude won't know when to auto-invoke the skill
- **WARNING** if `disable-model-invocation: true` and `user-invocable: false` are both set — skill is unreachable
- **WARNING** if frontmatter uses non-boolean values for boolean fields (e.g. `disable-model-invocation: yes`)

## 2. Description quality

- **WARNING** if description exceeds 200 characters — long descriptions consume context budget (budget is 2% of context window)
- **WARNING** if description is vague or generic (e.g. "A useful skill", "Does stuff") — should explain what the skill does AND when to use it
- **SUGGESTION** if description lacks trigger phrases — adding phrases like "Use when..." helps Claude match better
- **SUGGESTION** if similar keywords appear in multiple skill descriptions in the same scope — may cause Claude to pick the wrong skill

## 3. File structure

- **ERROR** if `SKILL.md` does not exist in the skill directory
- **WARNING** if SKILL.md exceeds 500 lines — extract detailed content into supporting files
- **WARNING** if skill references files (e.g. `[ref](file.md)`) that don't exist in the skill directory
- **SUGGESTION** if SKILL.md has large code blocks or reference sections that could be extracted into supporting files
- **SUGGESTION** if the skill directory contains files not referenced from SKILL.md — they won't be discovered

## 4. Dynamic context (`!`command``)

### What it does
`!`command`` runs a shell command during skill preprocessing. The output replaces the placeholder before Claude sees the content. This is useful for injecting live environment data.

### Checks

- **WARNING** if `!`command`` uses commands that may not exist on all systems — check for fallbacks (e.g. `command -v foo && foo || echo "not found"`)
- **WARNING** if `!`command`` output could be very large (e.g. `cat` on unbounded files without `head`/`tail`) — can bloat context
- **WARNING** if `!`command`` has no error handling — should include `|| echo "fallback"` to avoid silent failures
- **SUGGESTION** if skill hardcodes environment info that could be detected at runtime — recommend `!`command`` instead:
  - Project framework → `!`ls vite.config.* next.config.* 2>/dev/null``
  - Git state → `!`git branch --show-current 2>/dev/null``
  - Package manager → `!`which pnpm 2>/dev/null && echo pnpm || which yarn 2>/dev/null && echo yarn || echo npm``
  - Installed tools → `!`command -v <tool> 2>/dev/null && <tool> --version || echo "not installed"``
  - Active processes → `!`lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | head -5``
- **SUGGESTION** if the skill interacts with external services (GitHub, npm, etc.) — could use `!`command`` to prefetch relevant state

## 5. Argument handling

- **WARNING** if content uses `$ARGUMENTS` or `$0`/`$1` etc. but frontmatter has no `argument-hint` — users won't know what to pass
- **WARNING** if content uses positional args (`$0`, `$1`, `$ARGUMENTS[0]`) but doesn't document what each position means
- **SUGGESTION** if skill would be more flexible with arguments but currently has none — e.g. a deploy skill could accept an environment name

## 6. Tool permissions (`allowed-tools`)

- **ERROR** if `allowed-tools` includes `Bash(*)` — grants unrestricted shell access, should be scoped
- **WARNING** if `allowed-tools` includes broad patterns like `Bash(rm *)`, `Bash(git push *)`, `Bash(docker *)` — potentially destructive
- **WARNING** if skill performs shell operations but has no `allowed-tools` — user will be prompted for every command
- **SUGGESTION** if `allowed-tools` could be narrowed — e.g. `Bash(npm *)` could be `Bash(npm run *)` and `Bash(npm test *)`
- **SUGGESTION** if a read-only skill doesn't restrict tools — add `allowed-tools: Read, Grep, Glob` to enforce safety

## 7. Content quality

- **WARNING** if skill has `context: fork` but content is only guidelines/conventions without an actionable task — subagent will have nothing to do
- **WARNING** if skill lacks clear structure (no headers, no numbered steps, no sections)
- **WARNING** if skill instructions are ambiguous about failure modes — should specify what to do when things go wrong
- **SUGGESTION** if skill could benefit from a verify-and-retry pattern but doesn't include one
- **SUGGESTION** if skill performs multi-step work that could benefit from `context: fork` for isolation

## 8. Security & safety

- **ERROR** if skill content includes hardcoded secrets, tokens, or credentials
- **WARNING** if skill writes to paths outside the project without user confirmation
- **WARNING** if skill runs destructive commands (rm, git reset, drop table) without confirmation steps
- **SUGGESTION** if skill makes external API calls — should document what data is sent

## 9. Invocation control

- **WARNING** if skill has side effects that are NOT its core purpose (e.g. a code-review skill that also deploys) but `disable-model-invocation` is not `true` — Claude might trigger it automatically. Do NOT flag skills whose side effects ARE the intended behavior (e.g. dev-server starting a server, browser opening a page).
- **SUGGESTION** if skill is purely informational/contextual but is user-invocable — consider `user-invocable: false`
- **SUGGESTION** if skill name could collide with skills at other scopes (personal vs project) — consider more specific naming
