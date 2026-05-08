# TaskFlow

A single-file, zero-dependency task manager. No build step, no server, no install — just open `taskflow.html` in any browser.

## Features

- Add tasks with due dates and priority levels (low / medium / high)
- Filter by all, active, or completed
- Per-task notes panel
- Overdue date detection
- 5 themes: Midnight, Sakura, Ocean, Neon, Forest
- All state persisted to `localStorage`

## Usage

Download `taskflow.html` and open it in your browser.

## Development

```bash
npm install      # installs jsdom for tests
npm test         # runs the test suite
```
