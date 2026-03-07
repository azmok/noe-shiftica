# Long-Term Memory & Project Context

## Overview
This file tracks unique project learnings, specifically patterns and troubleshooting steps discovered during execution that are not already defined in the core project rules (GEMINI.md).

## Induction & Troubleshooting Lessons
- *HTML Source Editor (Lexical Payload v3)*: When registering custom Lexical toolbar items in Payload v3, use the `Component` property instead of `ChildComponent`. Using `ChildComponent` causes Payload to wrap the custom element in a standard `<button>`, leading to invalid nested buttons that React refuses to render.
