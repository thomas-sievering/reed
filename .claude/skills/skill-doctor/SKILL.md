---
name: skill-doctor
description: Audit Claude Code skills for valid frontmatter, best practices, and improvements. Use when creating, reviewing, or troubleshooting skills.
argument-hint: "[skill-path-or-name]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(wc *)
---

# Skill Doctor

Audit one or more SKILL.md files and produce a diagnostic report. For the full checklist, see [checklist.md](checklist.md).

## Discovered skills

### Project skills
Use Glob with pattern `**/SKILL.md` and path `.claude/skills` to discover project skills. If none are found, note "None found".

### Personal skills
Use Glob with pattern `**/SKILL.md` and path `~/.claude/skills` to discover personal skills. If none are found, note "None found".

## Locate skills to audit

If `$ARGUMENTS` is a path to a specific SKILL.md or skill directory, audit that one skill.
If `$ARGUMENTS` is a skill name (e.g. `browser`), resolve it from the discovered skills above.
Otherwise, audit all discovered skills.

## Audit process

For each SKILL.md found, read the file and run every check from [checklist.md](checklist.md). Categorize each finding as:

- **ERROR** — Invalid configuration that will cause problems (unknown frontmatter field, missing SKILL.md, etc.)
- **WARNING** — Deviation from best practices that may cause unexpected behavior
- **SUGGESTION** — Improvement opportunity that would make the skill more robust or maintainable

## Report format

**Only report findings (errors, warnings, suggestions). Do not list passing checks — they are noise.**

Output a table per skill with only the findings, then a summary. If a skill has no findings, say "No issues found" and move on.

### Per-skill report

```
## <skill-name> (<path>)

| Severity | Category | Finding |
|----------|----------|---------|
| ❌ ERROR | Frontmatter | Unknown field `trigger` — not a recognized field. Did you mean `description`? |
| ⚠️ WARNING | Description | Exceeds 200 characters — may be truncated in context budget |
| ⚠️ WARNING | Structure | No supporting files referenced — consider extracting large sections |
| 💡 SUGGESTION | Dynamic context | Could use bang-command injection to inject live data instead of hardcoded values |
```

### Summary

```
Skills audited: 3 | Errors: 2 | Warnings: 3 | Suggestions: 5
```

## Fixing issues

After presenting the report, ask if the user wants you to fix any of the reported issues. If yes, apply fixes directly to the SKILL.md files. For suggestions, explain the improvement and let the user decide.
