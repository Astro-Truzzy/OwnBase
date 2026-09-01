# Ownbase Dashboard Redesign — Agent Implementation Prompt

Paste everything below this line into Cursor / Claude Code as your instruction,
with `Ownbase-Dashboard-Design-Spec.pdf` attached or in the repo for reference.

---

## Context

You are implementing a redesign of the Ownbase user dashboard. Ownbase is a
developer-access and code-management platform: it lets a business owner link
GitHub/GitLab repositories, manage granular per-repo access for
collaborators, monitor activity in real time, and get AI-generated
plain-language summaries of their own codebase — so the owner never loses
control of or visibility into their code, even if the developer who built it
leaves.

The current stack is: **React frontend, Node.js backend, TypeScript
throughout, Supabase for data and real-time activity monitoring, OpenAI
integration for codebase summaries, GSAP/Three.js for motion and visual
effects.** Treat this as fixed — do not introduce a different framework,
state manager, backend, or database without asking first.

The attached document, **"Ownbase User Dashboard — Complete Redesign" (Design
Spec v2.0)**, is your source of truth for scope, screens, interaction logic,
the permissions model, and the data model. Read it in full before writing
any code.

## Prime directive: do not break what already works

This is a redesign layered onto a **live, working product** — not a rebuild
from scratch. Before changing anything:

1. **Audit first.** Read through the existing dashboard codebase — routing,
   components, state management, API calls, auth/session handling, Supabase
   queries, and the GitHub/GitLab OAuth and webhook integration — and
   produce a short written summary of what currently exists and how it maps
   to the ten screens in the spec, before touching any code. Show me this
   mapping before starting Phase 1.
2. **Preserve existing logic that isn't addressed or contradicted by the
   spec.** The spec is thorough but not exhaustive — if you find working
   functionality (a feature, an edge-case handler, a validation rule) that
   the spec doesn't mention and doesn't conflict with, **keep it**. Do not
   delete or simplify anything on the assumption it's now obsolete. If
   you're not sure whether something conflicts with the spec or is just
   unaddressed by it, ask me rather than guessing.
3. **Never change auth, billing/payment, or OAuth/webhook logic as a side
   effect of a UI change.** These are the highest-blast-radius systems in
   this app. If the redesign genuinely requires a change here (e.g. the new
   permissions model in Section 15 needs a new field), stop and confirm the
   exact change with me before implementing it.
4. **No big-bang rewrite.** Build the new UI incrementally, screen by
   screen, in the phases below, behind a feature flag or route if the
   framework supports it, so the existing dashboard keeps working for real
   users at every step until each phase is verified.

## Visual system: reconcile with the landing page, don't override it

The spec (Section 03) proposes a color palette, type scale, and component
styles for the dashboard in isolation. Before implementing it:

- **Inspect the actual landing page's design tokens first** — its colors,
  fonts, spacing, and component style (buttons, cards, radii, shadows).
  Extract these as the base system.
- Reconcile the spec's palette against them: keep the landing page's brand
  colors, primary/accent hues, and typeface as the foundation, and only pull
  in spec-specific semantic colors (success/warning/danger, the AI-teal
  accent) where the landing page doesn't already define an equivalent. The
  goal is a dashboard that feels like the same product as the landing page,
  not a visually distinct app bolted on next to it.
- If the landing page and the spec meaningfully conflict (e.g. the landing
  page's primary color reads poorly as a "danger" or "risk" signal), flag
  the conflict to me with your proposed resolution instead of silently
  picking one.
- Once reconciled, define this as a single source of truth (design tokens /
  CSS variables / theme file) that both the landing page and dashboard pull
  from, if they don't already share one.

## Quality bar

- Follow current framework and accessibility best practices: semantic
  HTML, proper ARIA where components are custom (permission matrix,
  status pills, modals), keyboard navigability, sufficient color contrast
  (the spec already requires status to never rely on color alone — enforce
  that in implementation, not just in the mock).
- Componentize per the spec's component list (status pill, metric card,
  permission matrix cell, timeline row, AI summary card, destructive
  confirmation modal) as shared, reusable components — not one-off markup
  per screen.
- Motion and interaction should feel **smooth, intentional, and premium**:
  purposeful transitions (panel expand/collapse, matrix cell edit,
  drawer open/close), not decorative animation for its own sake. Use the
  existing GSAP setup for this rather than introducing a second animation
  library.
- Loading, empty, and error states are not optional polish — implement
  every state listed in Section 17 for each screen as you build it, not as
  a follow-up pass.
- Performance: real-time Supabase subscriptions (activity feed, sync
  status) should be scoped and cleaned up properly — no leaked
  subscriptions across screen navigation.

## Build in phases — do not skip ahead

Follow this order. **Stop at the end of each phase, summarize what changed,
and wait for my confirmation before starting the next one.**

1. **Phase 0 — Audit & tokens.** Existing-codebase mapping (see above) +
   reconciled design-token system. No screen changes yet.
2. **Phase 1 — Overview redesign + Team & Access permission matrix.**
   Highest-visibility screens; the matrix replaces the current flat
   collaborator list.
3. **Phase 2 — Continuity & Offboarding Center + unified Activity & Audit
   Log.** New screen + the merged Git/Ownbase-native event timeline.
4. **Phase 3 — AI Codebase Insights upgrade.** Module map, Q&A, summary
   history/diff.
5. **Phase 4 — Mobile responsive pass, Billing redesign, Settings
   consolidation.**

Within each phase, implement screen-by-screen, not all components at once —
finish and verify one screen before starting the next.

## When to ask instead of assuming

Ask me before proceeding whenever you hit:

- Any ambiguity between the spec and the existing codebase's current
  behavior.
- Any change that touches auth, payments, OAuth/webhooks, or the database
  schema.
- Any spec detail that seems to require a new dependency, a new backend
  endpoint, or a new third-party service.
- Any destructive action (deleting a component, route, or table/column) —
  even if it looks unused.
- Any point where two reasonable interpretations of the spec would lead to
  meaningfully different implementations.

Default to asking a short, specific question over making a silent judgment
call, especially in Phase 0 and whenever you're about to touch shared
infrastructure (auth, API layer, database).

## Definition of done for each phase

- Matches the relevant section(s) of the design spec.
- Does not regress any existing, working functionality outside the spec's
  scope.
- Uses the reconciled design-token system, not one-off hardcoded values.
- Has loading/empty/error states implemented, not stubbed.
- Is responsive per Section 18 for the screens in that phase.
- You've given me a short summary of what changed and flagged anything you
  weren't sure about, before moving to the next phase.
