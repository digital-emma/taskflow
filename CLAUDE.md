# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TaskFlow is a single-file, zero-dependency task manager (`taskflow.html`). Open it directly in any browser — there is no build step, server, package manager, or test suite.

## Architecture

Everything lives in `taskflow.html`, organized into three sections:

**CSS (lines 7–606):** Theme variables are declared as CSS custom properties on `[data-theme="<name>"]` attribute selectors on `<html>`. Themes: `midnight`, `sakura`, `ocean`, `neon`, `forest`. Neon and Forest override component styles (`.add-btn`, `.chk.on`, etc.) with theme-specific rules below the base variables. All colors reference `var(--*)` tokens — add a new theme by adding a new `[data-theme]` block.

**HTML (lines 608–652):** Static shell only. The task list (`#taskList`) and stats bar (`#stats`) are entirely DOM-rendered by JavaScript; there is no server-side or template rendering.

**JavaScript (lines 654–890):** Plain vanilla JS, no framework.
- State: `tasks` (array), `filter` (string), `theme` (string) — all persisted to `localStorage` under keys `tf_tasks`, `tf_filter`, `tf_theme`.
- `render()` rebuilds `#taskList` and `#stats` from scratch on every state change using `taskHTML()` for each task, then re-attaches event listeners. There is no virtual DOM or diffing.
- `toggle(id, key)` flips a boolean field on a task (used for both `done` and `expanded`).
- Notes are saved on `textarea` `input` events without debouncing; `updateNoteDot()` updates the indicator dot in-place without a full re-render.
- Date comparison uses ISO string lexicographic ordering (`iso < todayISO()`), which works correctly for `YYYY-MM-DD` format.
- `esc()` is the only XSS guard — all user-supplied strings rendered into innerHTML must go through it.
