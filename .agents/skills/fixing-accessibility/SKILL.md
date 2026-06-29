---
name: fixing-accessibility
description: Audit and fix HTML accessibility issues including ARIA labels, keyboard navigation, focus management, color contrast, and form errors.
metadata:
  author: ibelick
  source: ibelick/ui-skills
---

# Fixing Accessibility

Use when adding interactive controls, forms, dialogs, or reviewing WCAG compliance.

## Protocol

1. Audit focus order and keyboard traps in modals/dialogs
2. Ensure every input has an associated label (`htmlFor`/`id`)
3. Add `aria-label` to icon-only buttons
4. Use `role="alert"` for errors and `role="status"` for loading states
5. Verify color contrast on interactive elements
6. Respect `prefers-reduced-motion`

## CLI

```bash
npx ui-skills get fixing-accessibility
```
