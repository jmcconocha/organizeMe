# Project Portfolio Manager — Product Spec

## Overview
- Purpose: Centralize tracking of diverse software projects (domains, tech stacks, git state, activity, notes, AI tool usage) with a fast web UI and CLI.
- Audience: Individual developer and small teams managing multiple repos across domains.
- Value: Rapid context recovery, metadata-rich filtering, PR/branch visibility, and cross-project insights.

## Goals
- Automatically discover and track local projects by scanning folder structures.
- Extract key metadata per project: domain, tech stack, git state, activity timeline, notes, AI tools used.
- Provide fast portfolio dashboard with powerful filters and search.
- Share the same SQLite schema with the existing CLI; background scanning jobs keep data fresh.
- (Future) Integrate with GitHub OAuth to fetch PRs/branches and recent activity.

## Personas
- Developer: Needs quick status, last activity, and notes to resume work across multiple local projects.
- Tech Lead: Monitors active feature branches across repos in a workspace.
- Project Manager: Views progress, phase (MVP/Production), and activity trends.

## Success Metrics
- Average time-to-context < 10s.
- % projects with tech/domain tags auto-detected; % projects discovered via scan.
- Scan freshness: 90% repos updated within 60 minutes.
- Error rate < 0.5% on API; p95 read latency < 300 ms.

## Core Features
- Local folder scanning to auto-discover git repositories.
- Project registry with CRUD and manual addition.
- Kanban board for portfolio-level project management (columns: backlog, active, completed, archived).
- Project drill-down with kanban for managing phases and tasks within each project.
- Automatic metadata extraction: tech stack detection, git state (branch, last commit).
- Tech stack + domain tagging; filters and search.
- Activity timeline (local git history/scans).
- Notes per project; AI tool usage records per project.
- Background re-scanning jobs; manual refresh triggers.
- Single-user dashboard (multi-user as future feature).

## Non-Functional Requirements
- Performance: p95 < 300 ms on common reads; pagination on lists.
- Reliability: Job retries with backoff; health checks; backups.
- Security: SQLite file permissions; simple deployment model.
- Accessibility: WCAG 2.2 AA (future); keyboard navigation and ARIA.
- Operability: Metrics, logs, alerts; simple Docker deployment.

## Out of Scope (Initial)
- User authentication and multi-user support.
- GitHub OAuth integration and PR syncing.
- Non-Git providers.
- Issue/task tracking; CI orchestration.
- Billing/multi-tenant SaaS.

## Glossary
- Domain, Tech Stack, Git State, Activity, Notes, AI Tool, Scan, RBAC, OAuth, WAL, SLO/SLA.
