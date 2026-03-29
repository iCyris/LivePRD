export const prdCatalog = [
  {
    "file": "docs/prd/checkout-timeout-recovery.md",
    "slug": "checkout-timeout-recovery",
    "meta": {
      "title": "Checkout Timeout Recovery",
      "slug": "checkout-timeout-recovery",
      "owner": "PD Team",
      "status": "draft",
      "summary": "Preserve cart and task context after a checkout timeout, and use embedded interactive states to align product, design, and engineering on the recovery flow.",
      "theme": "editorial-warm",
      "reviewers": [
        "Design",
        "Frontend",
        "Backend"
      ]
    },
    "toc": [
      {
        "depth": 2,
        "text": "Background",
        "id": "background"
      },
      {
        "depth": 2,
        "text": "Problem",
        "id": "problem"
      },
      {
        "depth": 2,
        "text": "Goals",
        "id": "goals"
      },
      {
        "depth": 2,
        "text": "Non-Goals",
        "id": "non-goals"
      },
      {
        "depth": 2,
        "text": "User Flow",
        "id": "user-flow"
      },
      {
        "depth": 2,
        "text": "States and Edge Cases",
        "id": "states-and-edge-cases"
      },
      {
        "depth": 2,
        "text": "Live Demo",
        "id": "live-demo"
      },
      {
        "depth": 2,
        "text": "Acceptance Criteria",
        "id": "acceptance-criteria"
      },
      {
        "depth": 2,
        "text": "Open Questions",
        "id": "open-questions"
      }
    ],
    "theme": {
      "name": "editorial-warm",
      "label": "Editorial Warm",
      "description": "Warm editorial surfaces with clear hierarchy and softer product storytelling.",
      "tokens": {
        "radius": "24px",
        "fontHeading": "Georgia, Cambria, \"Times New Roman\", Times, serif",
        "fontBody": "\"Helvetica Neue\", Arial, sans-serif",
        "surface": "#fcf7f0",
        "surfaceAlt": "#f4e7d8",
        "panel": "#fffdf9",
        "text": "#221c18",
        "muted": "#6e6357",
        "primary": "#a44f24",
        "accent": "#d89357",
        "border": "#dcc4a6",
        "shadow": "0 24px 60px rgba(92, 51, 23, 0.10)"
      }
    },
    "markdown": "---\ntitle: Checkout Timeout Recovery\nslug: checkout-timeout-recovery\nowner: PD Team\nstatus: draft\nsummary: Preserve cart and task context after a checkout timeout, and use embedded interactive states to align product, design, and engineering on the recovery flow.\ntheme: editorial-warm\nreviewers:\n  - Design\n  - Frontend\n  - Backend\n---\n\n# Checkout Timeout Recovery\n\n## Background\n\nUsers occasionally hit a timeout after they submit checkout. The current experience is abrupt, provides weak explanation, and often causes the user to restart from the beginning.\n\n## Problem\n\nWe lose trust and completion intent when the system fails at the most sensitive point of the journey. Product and engineering also lack one artifact that shows the intended copy, preserved state, and recovery interaction together.\n\n## Goals\n\n- Keep the user on the checkout surface after timeout.\n- Preserve safe state such as cart contents and shipping fields.\n- Explain what happened in calm, action-oriented copy.\n- Let engineering inspect an interactive version of the requirement directly inside the PRD.\n\n## Non-Goals\n\n- Replace the entire checkout information architecture.\n- Redesign payment capture infrastructure.\n\n## User Flow\n\n1. User confirms checkout.\n2. Payment service or order orchestration times out.\n3. Checkout stays mounted and switches into a recovery state.\n4. User sees what was preserved and what still needs action.\n5. User retries payment or exits with clear understanding.\n\n## States and Edge Cases\n\n- Timeout occurs after shipping is saved but before payment is confirmed.\n- Timeout occurs after payment authorization request is sent but no final result returns.\n- Retry succeeds on the next attempt.\n- Retry fails again and support guidance is shown.\n- Session has expired too long to safely recover.\n\n## Live Demo\n\nThe card below is for copy, hierarchy, preserved-state messaging, and retry affordance alignment.\n\n:::live-demo\nid: retry-card\nsource: demos/retry-card.jsx\nheight: 430\ntheme: editorial-warm\ncaption: Focused component state for timeout recovery.\n:::\n\nThe page below gives engineering a fuller target surface with layout, narrative framing, and a right-rail summary.\n\n:::live-page\nid: checkout-recovery-page\nsource: demos/checkout-recovery-page.jsx\nroute: /playground/checkout-recovery\nheight: 840\ntheme: editorial-warm\ncaption: Page-level preview for the recovery experience.\n:::\n\n## Acceptance Criteria\n\n- A timeout does not send the user to the homepage.\n- Checkout keeps cart items and non-sensitive form data when recovery is safe.\n- The recovery surface explains the problem, preserved data, and next action.\n- The PRD includes at least one interactive artifact that engineering can inspect directly.\n- The embedded prototype and acceptance criteria stay aligned during iteration.\n\n## Open Questions\n\n- Which payment providers can safely resume after timeout versus requiring a full restart?\n- How long should preserved recovery state remain valid?\n\n<!-- live-prd-comments\n[\n  {\n    \"id\": \"comment-1774758497456\",\n    \"quote\": \"ccasionally hit a timeout after the\",\n    \"occurrence\": 0,\n    \"body\": \"你好\",\n    \"status\": \"open\",\n    \"createdAt\": \"2026-03-29T04:28:17.456Z\",\n    \"updatedAt\": \"2026-03-29T06:07:04.248Z\",\n    \"resolvedAt\": null\n  },\n  {\n    \"id\": \"comment-1774758607519\",\n    \"quote\": \"ompletion intent w\",\n    \"occurrence\": 0,\n    \"body\": \"测试22222\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T04:30:07.519Z\",\n    \"updatedAt\": \"2026-03-29T06:07:07.499Z\",\n    \"resolvedAt\": \"2026-03-29T06:07:07.499Z\"\n  },\n  {\n    \"id\": \"comment-1774758852839\",\n    \"quote\": \"bmit checkout. The current ex\",\n    \"occurrence\": 0,\n    \"body\": \"待确认\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T04:34:12.839Z\",\n    \"updatedAt\": \"2026-03-29T06:24:03.855Z\",\n    \"resolvedAt\": \"2026-03-29T06:24:03.855Z\"\n  }\n]\n-->\n",
    "blocks": [
      {
        "type": "markdown",
        "html": "<h1 id=\"checkout-timeout-recovery\">Checkout Timeout Recovery</h1><h2 id=\"background\">Background</h2><p>Users occasionally hit a timeout after they submit checkout. The current experience is abrupt, provides weak explanation, and often causes the user to restart from the beginning.</p>\n<h2 id=\"problem\">Problem</h2><p>We lose trust and completion intent when the system fails at the most sensitive point of the journey. Product and engineering also lack one artifact that shows the intended copy, preserved state, and recovery interaction together.</p>\n<h2 id=\"goals\">Goals</h2><ul>\n<li>Keep the user on the checkout surface after timeout.</li>\n<li>Preserve safe state such as cart contents and shipping fields.</li>\n<li>Explain what happened in calm, action-oriented copy.</li>\n<li>Let engineering inspect an interactive version of the requirement directly inside the PRD.</li>\n</ul>\n<h2 id=\"non-goals\">Non-Goals</h2><ul>\n<li>Replace the entire checkout information architecture.</li>\n<li>Redesign payment capture infrastructure.</li>\n</ul>\n<h2 id=\"user-flow\">User Flow</h2><ol>\n<li>User confirms checkout.</li>\n<li>Payment service or order orchestration times out.</li>\n<li>Checkout stays mounted and switches into a recovery state.</li>\n<li>User sees what was preserved and what still needs action.</li>\n<li>User retries payment or exits with clear understanding.</li>\n</ol>\n<h2 id=\"states-and-edge-cases\">States and Edge Cases</h2><ul>\n<li>Timeout occurs after shipping is saved but before payment is confirmed.</li>\n<li>Timeout occurs after payment authorization request is sent but no final result returns.</li>\n<li>Retry succeeds on the next attempt.</li>\n<li>Retry fails again and support guidance is shown.</li>\n<li>Session has expired too long to safely recover.</li>\n</ul>\n<h2 id=\"live-demo\">Live Demo</h2><p>The card below is for copy, hierarchy, preserved-state messaging, and retry affordance alignment.</p>\n"
      },
      {
        "type": "live-demo",
        "id": "retry-card",
        "source": "demos/retry-card.jsx",
        "route": "",
        "theme": "editorial-warm",
        "caption": "Focused component state for timeout recovery.",
        "height": 430
      },
      {
        "type": "markdown",
        "html": "<p>The page below gives engineering a fuller target surface with layout, narrative framing, and a right-rail summary.</p>\n"
      },
      {
        "type": "live-page",
        "id": "checkout-recovery-page",
        "source": "demos/checkout-recovery-page.jsx",
        "route": "/playground/checkout-recovery",
        "theme": "editorial-warm",
        "caption": "Page-level preview for the recovery experience.",
        "height": 840
      },
      {
        "type": "markdown",
        "html": "<h2 id=\"acceptance-criteria\">Acceptance Criteria</h2><ul>\n<li>A timeout does not send the user to the homepage.</li>\n<li>Checkout keeps cart items and non-sensitive form data when recovery is safe.</li>\n<li>The recovery surface explains the problem, preserved data, and next action.</li>\n<li>The PRD includes at least one interactive artifact that engineering can inspect directly.</li>\n<li>The embedded prototype and acceptance criteria stay aligned during iteration.</li>\n</ul>\n<h2 id=\"open-questions\">Open Questions</h2><ul>\n<li>Which payment providers can safely resume after timeout versus requiring a full restart?</li>\n<li>How long should preserved recovery state remain valid?</li>\n</ul>\n<!-- live-prd-comments\n[\n  {\n    \"id\": \"comment-1774758497456\",\n    \"quote\": \"ccasionally hit a timeout after the\",\n    \"occurrence\": 0,\n    \"body\": \"你好\",\n    \"status\": \"open\",\n    \"createdAt\": \"2026-03-29T04:28:17.456Z\",\n    \"updatedAt\": \"2026-03-29T06:07:04.248Z\",\n    \"resolvedAt\": null\n  },\n  {\n    \"id\": \"comment-1774758607519\",\n    \"quote\": \"ompletion intent w\",\n    \"occurrence\": 0,\n    \"body\": \"测试22222\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T04:30:07.519Z\",\n    \"updatedAt\": \"2026-03-29T06:07:07.499Z\",\n    \"resolvedAt\": \"2026-03-29T06:07:07.499Z\"\n  },\n  {\n    \"id\": \"comment-1774758852839\",\n    \"quote\": \"bmit checkout. The current ex\",\n    \"occurrence\": 0,\n    \"body\": \"待确认\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T04:34:12.839Z\",\n    \"updatedAt\": \"2026-03-29T06:24:03.855Z\",\n    \"resolvedAt\": \"2026-03-29T06:24:03.855Z\"\n  }\n]\n-->\n"
      }
    ]
  },
  {
    "file": "docs/prd/inventory-alert-prd.md",
    "slug": "inventory-alert-prd",
    "meta": {
      "title": "Inventory Exception Console",
      "slug": "inventory-alert-prd",
      "owner": "Supply Product",
      "status": "draft",
      "summary": "Help operations teams identify risky inventory exceptions earlier, assign owners faster, and resolve urgent cases without leaving the workflow context.",
      "theme": "fintech-clean",
      "reviewers": [
        "Design",
        "Frontend",
        "Operations",
        "Data"
      ]
    },
    "toc": [
      {
        "depth": 2,
        "text": "Document Overview",
        "id": "document-overview"
      },
      {
        "depth": 2,
        "text": "Background",
        "id": "background"
      },
      {
        "depth": 2,
        "text": "Problem",
        "id": "problem"
      },
      {
        "depth": 2,
        "text": "Goals",
        "id": "goals"
      },
      {
        "depth": 2,
        "text": "Non-Goals",
        "id": "non-goals"
      },
      {
        "depth": 2,
        "text": "Users",
        "id": "users"
      },
      {
        "depth": 3,
        "text": "Primary User",
        "id": "primary-user"
      },
      {
        "depth": 3,
        "text": "Secondary User",
        "id": "secondary-user"
      },
      {
        "depth": 2,
        "text": "Product Principles",
        "id": "product-principles"
      },
      {
        "depth": 2,
        "text": "User Flow",
        "id": "user-flow"
      },
      {
        "depth": 3,
        "text": "Happy Path",
        "id": "happy-path"
      },
      {
        "depth": 3,
        "text": "Recovery Path",
        "id": "recovery-path"
      },
      {
        "depth": 2,
        "text": "States and Edge Cases",
        "id": "states-and-edge-cases"
      },
      {
        "depth": 2,
        "text": "Scope Breakdown",
        "id": "scope-breakdown"
      },
      {
        "depth": 3,
        "text": "In Scope",
        "id": "in-scope"
      },
      {
        "depth": 3,
        "text": "Out of Scope",
        "id": "out-of-scope"
      },
      {
        "depth": 2,
        "text": "Requirements",
        "id": "requirements"
      },
      {
        "depth": 2,
        "text": "Live Demo",
        "id": "live-demo"
      },
      {
        "depth": 2,
        "text": "Acceptance Criteria",
        "id": "acceptance-criteria"
      },
      {
        "depth": 2,
        "text": "Success Metrics",
        "id": "success-metrics"
      },
      {
        "depth": 2,
        "text": "Delivery Notes",
        "id": "delivery-notes"
      },
      {
        "depth": 3,
        "text": "Data contract draft",
        "id": "data-contract-draft"
      },
      {
        "depth": 3,
        "text": "Implementation notes",
        "id": "implementation-notes"
      },
      {
        "depth": 2,
        "text": "Open Questions",
        "id": "open-questions"
      }
    ],
    "theme": {
      "name": "fintech-clean",
      "label": "Fintech Clean",
      "description": "Cool neutral product surfaces with crisp borders and compact hierarchy.",
      "tokens": {
        "radius": "18px",
        "fontHeading": "\"Segoe UI\", Arial, sans-serif",
        "fontBody": "\"Segoe UI\", Arial, sans-serif",
        "surface": "#f4f8fb",
        "surfaceAlt": "#e8f0f8",
        "panel": "#ffffff",
        "text": "#122033",
        "muted": "#5f7084",
        "primary": "#1457d2",
        "accent": "#4f9ff8",
        "border": "#c6d6ea",
        "shadow": "0 18px 48px rgba(20, 57, 112, 0.10)"
      }
    },
    "markdown": "---\ntitle: Inventory Exception Console\nslug: inventory-alert-prd\nowner: Supply Product\nstatus: draft\nsummary: Help operations teams identify risky inventory exceptions earlier, assign owners faster, and resolve urgent cases without leaving the workflow context.\ntheme: fintech-clean\nreviewers:\n  - Design\n  - Frontend\n  - Operations\n  - Data\n---\n\n# Inventory Exception Console\n\n## Document Overview\n\nThis PRD is intentionally written with a fuller Markdown structure so we can verify the HTML renderer across rich content blocks, not just short paragraphs.\n\n| Field | Value |\n| --- | --- |\n| Primary user | Operations specialist |\n| Secondary user | Inventory manager |\n| Main KPI | Time to first action on critical exception |\n| Launch scope | Web console only |\n| Delivery mode | Incremental rollout behind internal flag |\n\n## Background\n\nThe inventory team currently reacts to stock anomalies through a mix of spreadsheets, Slack pings, and delayed internal dashboards. By the time a planner sees an issue, a promotion may already be live, the PDP may already be showing incorrect stock, or customer service may already be handling fallout.\n\nSeveral teams have asked for one operational surface that combines:\n\n- a prioritized queue\n- clear severity logic\n- recommended actions\n- lightweight assignment and resolution workflows\n\n## Problem\n\nOps specialists do not have one place to review inventory exceptions, understand why each exception matters, and take the next action quickly. The existing workflow creates three repeated problems:\n\n1. Critical exceptions are mixed with low-priority noise.\n2. Ownership is unclear, so issues sit unassigned.\n3. Resolution notes live outside the operational surface, which weakens traceability.\n\n> We are not missing raw data. We are missing a fast, trustworthy place to turn that data into action.\n\n## Goals\n\n- Show a prioritized queue of inventory exceptions with severity, status, owner, and freshness.\n- Let an operator take the most common next actions without leaving the queue context.\n- Reduce the time from exception creation to first owner assignment.\n- Preserve an auditable history of why a case was updated.\n- Provide a live interactive artifact inside the PRD so design and engineering can align on the exact interaction.\n\n## Non-Goals\n\n- Redesign the forecasting or replenishment algorithms themselves.\n- Build a full analytics warehouse replacement.\n- Solve vendor communication workflows in this phase.\n- Replace all existing operations tooling on day one.\n\n## Users\n\n### Primary User\n\nThe primary user is an operations specialist monitoring daily exception queues and making the first triage decision.\n\n### Secondary User\n\nThe secondary user is an inventory manager who reviews trends, reassigns blocked work, and approves higher-risk actions.\n\n## Product Principles\n\n- Make urgency obvious without overwhelming the operator.\n- Keep the most common actions one click away.\n- Preserve context before asking for a decision.\n- Prefer structured fields over free-form process memory.\n\n## User Flow\n\n1. The operator lands on the exception console at the start of a shift.\n2. The queue defaults to `Critical` and `Needs action` items sorted by freshness.\n3. The operator opens one row to inspect affected SKU, channel, and recommended action.\n4. The operator either assigns the case, requests verification, or marks a mitigation plan.\n5. The system records the update and returns the operator to the queue with the case status refreshed.\n\n### Happy Path\n\n- Operator filters to critical exceptions.\n- Operator opens an exception with no owner.\n- Operator assigns the case to a regional planner with a due time.\n- Operator adds a short operational note.\n- Case moves from `Needs action` to `In progress`.\n\n### Recovery Path\n\n- Operator opens a case but does not have enough confidence to assign it.\n- Operator marks it as `Needs verification`.\n- System keeps the note, requested verifier, and latest timestamp visible in the queue.\n\n## States and Edge Cases\n\n- A row has no owner and is older than SLA threshold.\n- The recommended action is unavailable because the downstream service is degraded.\n- The same SKU appears in multiple channels with different severities.\n- An operator opens the action modal, changes the assignee, then cancels.\n- A resolved item reopens because fresh stock data crosses the risk threshold again.\n\n## Scope Breakdown\n\n### In Scope\n\n- Queue list with sorting, status, severity, and assignee\n- Row-level action modal with editable form\n- Resolution notes and due time capture\n- Basic search by SKU, title, or market\n- Empty state and no-result state\n\n### Out of Scope\n\n- Bulk actions across dozens of rows\n- CSV export\n- Approval chain workflows\n- External notification routing\n\n## Requirements\n\n- [x] Render a readable queue with multiple columns.\n- [x] Keep action controls close to each row.\n- [x] Support an inline workflow that opens a form modal in the demo region.\n- [x] Preserve local UI state so reviewers can inspect interaction behavior.\n- [ ] Connect to real backend data in this prototype.\n\n## Live Demo\n\nThe first demo is intentionally interaction-heavy so we can inspect table rendering, actions, modal layering, and form controls inside the preview area.\n\n:::live-demo\nid: inventory-exception-queue\nsource: demos/inventory-exception-queue.jsx\nheight: 760\ntheme: fintech-clean\ncaption: Queue-based exception workflow with row actions, modal editing, and local state updates.\n:::\n\nThe second demo gives a fuller page context around the same queue pattern.\n\n:::live-page\nid: inventory-exception-page\nsource: demos/inventory-alert-page.jsx\nroute: /playground/inventory-exception-console\nheight: 920\ntheme: fintech-clean\ncaption: Full-page view of the operations console, including summary metrics and queue context.\n:::\n\nThe block below is a focused icon component sample for checking icon scale, semantic color, badge pairing, and icon-button rendering inside the HTML preview.\n\n:::live-demo\nid: inventory-status-icons\nsource: demos/inventory-status-icons.jsx\nheight: 420\ntheme: fintech-clean\ncaption: Compact icon-oriented component showcase for PRD rendering review.\n:::\n\nThe block below is a chart-oriented sample for checking bar-chart and line-chart rendering inside the PRD preview.\n\n:::live-demo\nid: inventory-trend-charts\nsource: demos/inventory-trend-charts.jsx\nheight: 460\ntheme: fintech-clean\ncaption: Native SVG bar and line chart sample for chart-style requirement modules.\n:::\n\n## Acceptance Criteria\n\n- Critical cases are visually distinguishable from lower-severity items.\n- The operator can open an action flow directly from a row.\n- The action modal supports updating owner, status, due time, and notes.\n- Saving a change updates the queue state in-place without navigating away.\n- Empty and filtered states remain understandable.\n\n## Success Metrics\n\n| Metric | Current baseline | Target |\n| --- | --- | --- |\n| Median time to first owner assignment | 47 min | under 15 min |\n| Critical exception backlog older than 2h | 19% | under 5% |\n| Ops handoff messages sent in Slack per day | 38 | under 10 |\n\n## Delivery Notes\n\n### Data contract draft\n\n```json\n{\n  \"id\": \"INV-2198\",\n  \"severity\": \"critical\",\n  \"status\": \"needs_action\",\n  \"sku\": \"SKU-44821\",\n  \"market\": \"US\",\n  \"owner\": null,\n  \"recommendedAction\": \"Pause campaign and verify stock delta\",\n  \"createdAt\": \"2026-03-29T08:30:00.000Z\"\n}\n```\n\n### Implementation notes\n\n- Prefer optimistic UI updates for assignment and status changes.\n- Preserve action history in a structured activity log.\n- Treat notes as operational annotations, not customer-facing content.\n\n## Open Questions\n\n- Should managers be able to override severity directly from the queue?\n- Do we need a dedicated status for `Waiting on vendor` in v1?\n- Which fields must be mandatory before a case can move to `Resolved`?\n\n<!-- live-prd-comments\n[\n  {\n    \"id\": \"comment-1774768643220\",\n    \"quote\": \"n structure\",\n    \"occurrence\": 0,\n    \"body\": \"你好22222\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T07:17:23.220Z\",\n    \"updatedAt\": \"2026-03-29T07:18:41.272Z\",\n    \"resolvedAt\": \"2026-03-29T07:18:41.272Z\"\n  }\n]\n-->\n",
    "blocks": [
      {
        "type": "markdown",
        "html": "<h1 id=\"inventory-exception-console\">Inventory Exception Console</h1><h2 id=\"document-overview\">Document Overview</h2><p>This PRD is intentionally written with a fuller Markdown structure so we can verify the HTML renderer across rich content blocks, not just short paragraphs.</p>\n<table>\n<thead>\n<tr>\n<th>Field</th>\n<th>Value</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>Primary user</td>\n<td>Operations specialist</td>\n</tr>\n<tr>\n<td>Secondary user</td>\n<td>Inventory manager</td>\n</tr>\n<tr>\n<td>Main KPI</td>\n<td>Time to first action on critical exception</td>\n</tr>\n<tr>\n<td>Launch scope</td>\n<td>Web console only</td>\n</tr>\n<tr>\n<td>Delivery mode</td>\n<td>Incremental rollout behind internal flag</td>\n</tr>\n</tbody></table>\n<h2 id=\"background\">Background</h2><p>The inventory team currently reacts to stock anomalies through a mix of spreadsheets, Slack pings, and delayed internal dashboards. By the time a planner sees an issue, a promotion may already be live, the PDP may already be showing incorrect stock, or customer service may already be handling fallout.</p>\n<p>Several teams have asked for one operational surface that combines:</p>\n<ul>\n<li>a prioritized queue</li>\n<li>clear severity logic</li>\n<li>recommended actions</li>\n<li>lightweight assignment and resolution workflows</li>\n</ul>\n<h2 id=\"problem\">Problem</h2><p>Ops specialists do not have one place to review inventory exceptions, understand why each exception matters, and take the next action quickly. The existing workflow creates three repeated problems:</p>\n<ol>\n<li>Critical exceptions are mixed with low-priority noise.</li>\n<li>Ownership is unclear, so issues sit unassigned.</li>\n<li>Resolution notes live outside the operational surface, which weakens traceability.</li>\n</ol>\n<blockquote><p>We are not missing raw data. We are missing a fast, trustworthy place to turn that data into action.</p>\n</blockquote><h2 id=\"goals\">Goals</h2><ul>\n<li>Show a prioritized queue of inventory exceptions with severity, status, owner, and freshness.</li>\n<li>Let an operator take the most common next actions without leaving the queue context.</li>\n<li>Reduce the time from exception creation to first owner assignment.</li>\n<li>Preserve an auditable history of why a case was updated.</li>\n<li>Provide a live interactive artifact inside the PRD so design and engineering can align on the exact interaction.</li>\n</ul>\n<h2 id=\"non-goals\">Non-Goals</h2><ul>\n<li>Redesign the forecasting or replenishment algorithms themselves.</li>\n<li>Build a full analytics warehouse replacement.</li>\n<li>Solve vendor communication workflows in this phase.</li>\n<li>Replace all existing operations tooling on day one.</li>\n</ul>\n<h2 id=\"users\">Users</h2><h3 id=\"primary-user\">Primary User</h3><p>The primary user is an operations specialist monitoring daily exception queues and making the first triage decision.</p>\n<h3 id=\"secondary-user\">Secondary User</h3><p>The secondary user is an inventory manager who reviews trends, reassigns blocked work, and approves higher-risk actions.</p>\n<h2 id=\"product-principles\">Product Principles</h2><ul>\n<li>Make urgency obvious without overwhelming the operator.</li>\n<li>Keep the most common actions one click away.</li>\n<li>Preserve context before asking for a decision.</li>\n<li>Prefer structured fields over free-form process memory.</li>\n</ul>\n<h2 id=\"user-flow\">User Flow</h2><ol>\n<li>The operator lands on the exception console at the start of a shift.</li>\n<li>The queue defaults to <code>Critical</code> and <code>Needs action</code> items sorted by freshness.</li>\n<li>The operator opens one row to inspect affected SKU, channel, and recommended action.</li>\n<li>The operator either assigns the case, requests verification, or marks a mitigation plan.</li>\n<li>The system records the update and returns the operator to the queue with the case status refreshed.</li>\n</ol>\n<h3 id=\"happy-path\">Happy Path</h3><ul>\n<li>Operator filters to critical exceptions.</li>\n<li>Operator opens an exception with no owner.</li>\n<li>Operator assigns the case to a regional planner with a due time.</li>\n<li>Operator adds a short operational note.</li>\n<li>Case moves from <code>Needs action</code> to <code>In progress</code>.</li>\n</ul>\n<h3 id=\"recovery-path\">Recovery Path</h3><ul>\n<li>Operator opens a case but does not have enough confidence to assign it.</li>\n<li>Operator marks it as <code>Needs verification</code>.</li>\n<li>System keeps the note, requested verifier, and latest timestamp visible in the queue.</li>\n</ul>\n<h2 id=\"states-and-edge-cases\">States and Edge Cases</h2><ul>\n<li>A row has no owner and is older than SLA threshold.</li>\n<li>The recommended action is unavailable because the downstream service is degraded.</li>\n<li>The same SKU appears in multiple channels with different severities.</li>\n<li>An operator opens the action modal, changes the assignee, then cancels.</li>\n<li>A resolved item reopens because fresh stock data crosses the risk threshold again.</li>\n</ul>\n<h2 id=\"scope-breakdown\">Scope Breakdown</h2><h3 id=\"in-scope\">In Scope</h3><ul>\n<li>Queue list with sorting, status, severity, and assignee</li>\n<li>Row-level action modal with editable form</li>\n<li>Resolution notes and due time capture</li>\n<li>Basic search by SKU, title, or market</li>\n<li>Empty state and no-result state</li>\n</ul>\n<h3 id=\"out-of-scope\">Out of Scope</h3><ul>\n<li>Bulk actions across dozens of rows</li>\n<li>CSV export</li>\n<li>Approval chain workflows</li>\n<li>External notification routing</li>\n</ul>\n<h2 id=\"requirements\">Requirements</h2><ul>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> Render a readable queue with multiple columns.</li>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> Keep action controls close to each row.</li>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> Support an inline workflow that opens a form modal in the demo region.</li>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> Preserve local UI state so reviewers can inspect interaction behavior.</li>\n<li><input disabled=\"\" type=\"checkbox\"> Connect to real backend data in this prototype.</li>\n</ul>\n<h2 id=\"live-demo\">Live Demo</h2><p>The first demo is intentionally interaction-heavy so we can inspect table rendering, actions, modal layering, and form controls inside the preview area.</p>\n"
      },
      {
        "type": "live-demo",
        "id": "inventory-exception-queue",
        "source": "demos/inventory-exception-queue.jsx",
        "route": "",
        "theme": "fintech-clean",
        "caption": "Queue-based exception workflow with row actions, modal editing, and local state updates.",
        "height": 760
      },
      {
        "type": "markdown",
        "html": "<p>The second demo gives a fuller page context around the same queue pattern.</p>\n"
      },
      {
        "type": "live-page",
        "id": "inventory-exception-page",
        "source": "demos/inventory-alert-page.jsx",
        "route": "/playground/inventory-exception-console",
        "theme": "fintech-clean",
        "caption": "Full-page view of the operations console, including summary metrics and queue context.",
        "height": 920
      },
      {
        "type": "markdown",
        "html": "<p>The block below is a focused icon component sample for checking icon scale, semantic color, badge pairing, and icon-button rendering inside the HTML preview.</p>\n"
      },
      {
        "type": "live-demo",
        "id": "inventory-status-icons",
        "source": "demos/inventory-status-icons.jsx",
        "route": "",
        "theme": "fintech-clean",
        "caption": "Compact icon-oriented component showcase for PRD rendering review.",
        "height": 420
      },
      {
        "type": "markdown",
        "html": "<p>The block below is a chart-oriented sample for checking bar-chart and line-chart rendering inside the PRD preview.</p>\n"
      },
      {
        "type": "live-demo",
        "id": "inventory-trend-charts",
        "source": "demos/inventory-trend-charts.jsx",
        "route": "",
        "theme": "fintech-clean",
        "caption": "Native SVG bar and line chart sample for chart-style requirement modules.",
        "height": 460
      },
      {
        "type": "markdown",
        "html": "<h2 id=\"acceptance-criteria\">Acceptance Criteria</h2><ul>\n<li>Critical cases are visually distinguishable from lower-severity items.</li>\n<li>The operator can open an action flow directly from a row.</li>\n<li>The action modal supports updating owner, status, due time, and notes.</li>\n<li>Saving a change updates the queue state in-place without navigating away.</li>\n<li>Empty and filtered states remain understandable.</li>\n</ul>\n<h2 id=\"success-metrics\">Success Metrics</h2><table>\n<thead>\n<tr>\n<th>Metric</th>\n<th>Current baseline</th>\n<th>Target</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>Median time to first owner assignment</td>\n<td>47 min</td>\n<td>under 15 min</td>\n</tr>\n<tr>\n<td>Critical exception backlog older than 2h</td>\n<td>19%</td>\n<td>under 5%</td>\n</tr>\n<tr>\n<td>Ops handoff messages sent in Slack per day</td>\n<td>38</td>\n<td>under 10</td>\n</tr>\n</tbody></table>\n<h2 id=\"delivery-notes\">Delivery Notes</h2><h3 id=\"data-contract-draft\">Data contract draft</h3><div class=\"prd-code-block\"><div class=\"prd-code-head\"><span>json</span></div><pre><code class=\"language-json\">{\n  &quot;id&quot;: &quot;INV-<span class=\"tok-number\">2198</span>&quot;,\n  &quot;severity&quot;: &quot;critical&quot;,\n  &quot;status&quot;: &quot;needs_action&quot;,\n  &quot;sku&quot;: &quot;SKU-<span class=\"tok-number\">44821</span>&quot;,\n  &quot;market&quot;: &quot;US&quot;,\n  &quot;owner&quot;: <span class=\"tok-keyword\">null</span>,\n  &quot;recommendedAction&quot;: &quot;Pause campaign and verify stock delta&quot;,\n  &quot;createdAt&quot;: &quot;<span class=\"tok-number\">2026</span>-<span class=\"tok-number\">03</span>-29T08:<span class=\"tok-number\">30</span>:<span class=\"tok-number\">00</span>.000Z&quot;\n}</code></pre></div><h3 id=\"implementation-notes\">Implementation notes</h3><ul>\n<li>Prefer optimistic UI updates for assignment and status changes.</li>\n<li>Preserve action history in a structured activity log.</li>\n<li>Treat notes as operational annotations, not customer-facing content.</li>\n</ul>\n<h2 id=\"open-questions\">Open Questions</h2><ul>\n<li>Should managers be able to override severity directly from the queue?</li>\n<li>Do we need a dedicated status for <code>Waiting on vendor</code> in v1?</li>\n<li>Which fields must be mandatory before a case can move to <code>Resolved</code>?</li>\n</ul>\n<!-- live-prd-comments\n[\n  {\n    \"id\": \"comment-1774768643220\",\n    \"quote\": \"n structure\",\n    \"occurrence\": 0,\n    \"body\": \"你好22222\",\n    \"status\": \"resolved\",\n    \"createdAt\": \"2026-03-29T07:17:23.220Z\",\n    \"updatedAt\": \"2026-03-29T07:18:41.272Z\",\n    \"resolvedAt\": \"2026-03-29T07:18:41.272Z\"\n  }\n]\n-->\n"
      }
    ]
  }
];
export const defaultPrdSlug = prdCatalog[0]?.slug ?? "";
export default prdCatalog;
