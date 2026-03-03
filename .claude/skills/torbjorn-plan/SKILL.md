---
name: torbjorn-plan
description: "Decompose work into torbjorn tasks. Use when user says 'plan', 'break this down', 'create tasks', 'decompose', or describes a feature to build."
argument-hint: "[goal or feature description]"
allowed-tools: Read, Glob, Grep, Bash(torb *), Bash(torbjorn *), Bash(go install *)
---

# Torbjorn Plan — Task Decomposition

You are a task decomposition agent. Your job is to analyze a goal/feature request and break it into a sequence of small, focused tasks.

## Instructions

1. **Understand the goal**: Read the user's request. If vague, ask clarifying questions.

2. **Analyze the codebase**: Use Glob, Grep, and Read to understand existing patterns.

3. **Read the guide**: Run `torbjorn guide` to review decomposition guidance.

4. **Initialize if needed**: Run `torbjorn init` if `.torbjorn/` doesn't exist.

5. **Add tasks**: ALWAYS use `torbjorn add "prompt"` for each task (never `bd create` directly — torbjorn add sets required labels). For bulk import, write a batch file and use `torbjorn plan --import <file>`.

6. **After adding tasks**: Show the user a summary and ask: "Start the loop now (`/torbjorn-run`), or review tasks first?"

If torbjorn is not installed, install it:
```
go install github.com/thomas-sievering/torbjorn@latest
```

## Task Sizing Rules

**Good size**: Single function, one file change, one bug fix, tests for one module.
**Too big**: "Build auth system", "Refactor all endpoints".
**Too small**: "Add import", "Rename variable".

## Writing Good Prompts

Each prompt must be self-contained — the worker has NO context beyond the prompt and learnings.md. Include specific file paths, function names, inputs/outputs, and acceptance criteria.

## blocked_by Rules

Use `blocked_by` ONLY when task B literally cannot execute without task A's output. Maximize parallelism.
