# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A PDF study progress tracker — a single-page web app where users load PDF files (individually or from a folder), read them in an embedded viewer, and track completion progress across a session. Sessions persist locally so users can resume where they left off.

## Specs (from specs.md)

All specs are written in Spanish in `specs.md`. Key requirements:

**Home screen**
- Rounded card with retro-style colored border and a back-glow effect
- Card acts as both a drag-and-drop target and a click-to-open file picker
- File picker accepts PDFs or folders (reads all PDFs inside)

**Reader screen**
- Embeds a PDF previewer inline (no new tab)
- Status bar at the top with two stacked thin progress bars:
  - Current document progress (pages read / total pages)
  - Session progress (files completed / total files)
  - Colors shift based on completion percentage
- Button on the right of the status bar to close the session and return to the home screen

**Session persistence**
- Recent sessions saved in `localStorage`
- On resume, verify each file still exists before opening; skip or warn on missing files

**UX / animations**
- Confetti celebration effect when completing a file or the full list
- Animations via **anime.js**
- Dark/light mode toggle as a floating button (bottom-right)
- Fully responsive (mobile and desktop)

## Intended Tech Stack

Nothing is implemented yet — the stack is open. Based on the specs:

- **anime.js** is explicitly required for animations
- A **PDF rendering library** is needed (e.g., PDF.js / `react-pdf`)
- A **confetti library** (e.g., `canvas-confetti`) for completion celebrations
- `localStorage` for session persistence (no backend required)
- Framework choice is open (vanilla JS, React, Vue, etc.)
