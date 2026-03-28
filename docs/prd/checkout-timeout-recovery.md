---
title: Checkout Timeout Recovery
slug: checkout-timeout-recovery
owner: PD Team
status: draft
summary: Preserve cart and task context after a checkout timeout, and use embedded interactive states to align product, design, and engineering on the recovery flow.
theme: editorial-warm
reviewers:
  - Design
  - Frontend
  - Backend
---

# Checkout Timeout Recovery

## Background

Users occasionally hit a timeout after they submit checkout. The current experience is abrupt, provides weak explanation, and often causes the user to restart from the beginning.

## Problem

We lose trust and completion intent when the system fails at the most sensitive point of the journey. Product and engineering also lack one artifact that shows the intended copy, preserved state, and recovery interaction together.

## Goals

- Keep the user on the checkout surface after timeout.
- Preserve safe state such as cart contents and shipping fields.
- Explain what happened in calm, action-oriented copy.
- Let engineering inspect an interactive version of the requirement directly inside the PRD.

## Non-Goals

- Replace the entire checkout information architecture.
- Redesign payment capture infrastructure.

## User Flow

1. User confirms checkout.
2. Payment service or order orchestration times out.
3. Checkout stays mounted and switches into a recovery state.
4. User sees what was preserved and what still needs action.
5. User retries payment or exits with clear understanding.

## States and Edge Cases

- Timeout occurs after shipping is saved but before payment is confirmed.
- Timeout occurs after payment authorization request is sent but no final result returns.
- Retry succeeds on the next attempt.
- Retry fails again and support guidance is shown.
- Session has expired too long to safely recover.

## Live Demo

The card below is for copy, hierarchy, preserved-state messaging, and retry affordance alignment.

:::live-demo
id: retry-card
source: demos/retry-card.jsx
height: 430
theme: editorial-warm
caption: Focused component state for timeout recovery.
:::

The page below gives engineering a fuller target surface with layout, narrative framing, and a right-rail summary.

:::live-page
id: checkout-recovery-page
source: demos/checkout-recovery-page.jsx
route: /playground/checkout-recovery
height: 840
theme: editorial-warm
caption: Page-level preview for the recovery experience.
:::

## Acceptance Criteria

- A timeout does not send the user to the homepage.
- Checkout keeps cart items and non-sensitive form data when recovery is safe.
- The recovery surface explains the problem, preserved data, and next action.
- The PRD includes at least one interactive artifact that engineering can inspect directly.
- The embedded prototype and acceptance criteria stay aligned during iteration.

## Open Questions

- Which payment providers can safely resume after timeout versus requiring a full restart?
- How long should preserved recovery state remain valid?
