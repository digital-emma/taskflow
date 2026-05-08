# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TaskFlow is a single-file, zero-dependency task manager (`index.html`). Open it directly in any browser — there is no build step, server, package manager, or test suite.

## Architecture

Everything lives in `index.html`, organized into three sections:

**CSS (lines 7–606):** Theme variables are declared as CSS custom properties on `[data-theme="<name>"]` attribute selectors on `<html>`. Themes: `midnight`, `sakura`, `ocean`, `neon`, `forest`. Neon and Forest override component styles (`.add-btn`, `.chk.on`, etc.) with theme-specific rules below the base variables. All colors reference `var(--*)` tokens — add a new theme by adding a new `[data-theme]` block.

**HTML (lines 608–652):** Static shell only. The task list (`#taskList`) and stats bar (`#stats`) are entirely DOM-rendered by JavaScript; there is no server-side or template rendering.

**JavaScript (lines 654–end):** Plain vanilla JS, no framework. Uses the Supabase JS v2 client loaded from CDN.
- State: `tasks` (array, loaded from Supabase), `filter` (string), `theme` (string). `filter` and `theme` are persisted to `localStorage` (`tf_filter`, `tf_theme`). Tasks are persisted entirely in Supabase.
- Supabase credentials are hardcoded at the top of the script as `SUPABASE_URL` and `SUPABASE_ANON` constants.
- Task object shape in-app: `{ id: uuid, title: string, dueDate: string (YYYY-MM-DD or ''), priority: 'low'|'med'|'high', done: boolean, notes: string, expanded: boolean }`. DB column names differ: `due_date`, `completed`, `notes`, `expanded`. `fromDB()` maps DB rows to app objects.
- `loadTasks()` fetches all rows ordered by `created_at desc` on init. All mutations (add, toggle, delete, notes) go directly to Supabase; `tasks` array is updated optimistically and reverted on error.
- `render()` rebuilds `#taskList` and `#stats` from scratch on every state change using `taskHTML()` for each task, then re-attaches event listeners. There is no virtual DOM or diffing. **Any new interactive element inside a task card must have its listener wired inside `render()` after the innerHTML is set** — there is no event delegation.
- `toggle(id, key)` is async — it updates the in-memory task and re-renders immediately (optimistic), then patches the DB. On error it reverts the local change and re-renders.
- Notes are saved on `textarea` `input` events with a 600 ms debounce before the Supabase PATCH; `updateNoteDot()` updates the indicator dot in-place without a full re-render.
- The notes panel expand/collapse is a CSS `max-height` transition (0 ↔ 220px) driven by toggling the `.open` class — no JS animation.
- Date comparison uses ISO string lexicographic ordering (`iso < todayISO()`), which works correctly for `YYYY-MM-DD` format.
- `esc()` is the only XSS guard — all user-supplied strings rendered into innerHTML must go through it.
- The Supabase `tasks` table requires columns: `id` (uuid, primary key, default gen_random_uuid()), `title` (text), `due_date` (date, nullable), `priority` (text), `completed` (boolean), `created_at` (timestamptz, default now()), `notes` (text, nullable), `expanded` (boolean, default false).
