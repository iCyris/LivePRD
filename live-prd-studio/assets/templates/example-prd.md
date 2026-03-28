---
title: Checkout Timeout Recovery
slug: checkout-timeout-recovery
owner: PD Team
status: draft
summary: Preserve cart context and guide recovery after a checkout timeout without sending the user back to the homepage.
theme: editorial-warm
reviewers:
  - Design
  - Frontend
---

# Checkout Timeout Recovery

## Background

Users can time out during checkout after entering shipping or payment details.

## Problem

The current recovery flow is abrupt and loses context, which increases abandonment and support tickets.

## Goals

- Preserve cart and form context after timeout.
- Explain what happened in plain language.
- Offer a clear retry path.

## Non-Goals

- Redesign the entire checkout experience.

## User Flow

1. User submits checkout.
2. Backend times out.
3. User stays in checkout and sees a recovery state.
4. User retries after understanding what was preserved.

## States and Edge Cases

- Payment timeout after form submit
- Retry succeeds
- Retry fails again
- Session expired beyond recovery window

## Live Demo

:::live-demo
id: retry-card
source: demos/retry-card.tsx
height: 420
theme: editorial-warm
:::

:::live-page
id: checkout-recovery-page
source: demos/checkout-recovery-page.tsx
route: /playground/checkout-recovery
height: 760
theme: editorial-warm
:::

## Acceptance Criteria

- User remains on checkout after a timeout.
- The cart summary and filled fields are preserved when safe to do so.
- The recovery UI explains the timeout and presents a retry action.
- Engineering can review the embedded demo and page as part of the PRD.

## Open Questions

- How long should recovery state remain valid before forcing a fresh checkout session?
