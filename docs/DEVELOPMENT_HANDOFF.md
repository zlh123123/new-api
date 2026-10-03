# Development handoff

This document records the current local implementation so another developer can continue from the `main` branch without reconstructing the recent work from chat history.

## Current scope

The repository is a Go/Gin + GORM API gateway with a React/Rsbuild frontend. The local development database is PostgreSQL through `docker-compose.dev.yml`; the application still keeps SQLite, MySQL, and PostgreSQL compatibility as a project requirement.

The current working set includes:

- A support-ticket flow for users and administrators.
- Image attachments in ticket messages.
- In-app notifications and polling reminders for new tickets and replies.
- Card-based redemption-code recharge UI.
- Updated Haoji branding/logo assets.
- Chinese translations for the new ticket UI and corrected administrator navigation.

## Support tickets

Backend models are in `model/support_ticket.go` and are migrated from `model/main.go`:

- `SupportTicket`
- `SupportTicketMessage`
- `SupportTicketAttachment`
- `SupportNotification`

Routes are registered in `router/api-router.go` under `/api/support`:

- `GET /tickets`: users see their own tickets; administrators see all tickets.
- `POST /tickets`: create a ticket using `multipart/form-data` with `subject`, `category`, `content`, and optional `files` fields.
- `GET /tickets/:id`: retrieve a ticket and its messages/attachments.
- `POST /tickets/:id/messages`: add a reply with optional image files.
- `PUT /tickets/:id/status`: open or close a ticket.
- `GET /attachments/:id`: authenticated attachment access.
- `GET /notifications`: retrieve notifications and unread count.
- `POST /notifications/:id/read` and `POST /notifications/read-all`: notification acknowledgement.

Attachments are validated as JPEG, PNG, GIF, or WebP, with at most five files per message and a 5 MB limit per file. Files are stored under `data/support-attachments` by default. Set `SUPPORT_UPLOAD_DIR` to override this path. Docker deployments should persist `/data` so uploaded files survive container recreation.

When a user creates a ticket, enabled administrators receive in-app notifications and an email when they have a non-empty email address. When an administrator replies, the ticket owner receives an in-app notification and an email when the account has a non-empty email address. The authenticated layout polls unread notifications every 30 seconds and shows an in-app toast. Email delivery runs asynchronously, so an SMTP outage is logged and does not block ticket creation or replies.

The frontend page is `web/src/features/support/support-page.tsx`, routed at `/support`. Administrators see only the `Admin > 工单管理` navigation entry; ordinary users see only `Personal > 客服工单`. The backend remains the source of truth for the administrator permission check.

## Local development

Start PostgreSQL:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

Start the API from the repository root:

```bash
go run main.go
```

Start the frontend:

```bash
cd web
bun run dev -- --host 0.0.0.0 --port 5173
```

The normal local addresses are:

- Frontend: `http://localhost:5173/`
- Support page: `http://localhost:5173/support`
- API: `http://localhost:3000/`

Do not commit `.env`, database volumes, uploaded attachments, SMTP credentials, upstream API keys, or other local secrets.

## Validation already run

- `go test ./...`
- `cd web && bun run typecheck`
- `cd web && bun run build`
- Targeted Oxlint checks for the new support and navigation files.

The repository has unrelated pre-existing lint findings outside this change; a full repository lint run should not be treated as clean without reviewing those separately.

## Suggested next steps

1. Add an administrator ticket detail view with user identity, category filters, status filters, and pagination if the number of tickets grows.
2. Add an unread-count badge to the sidebar or notification popover; the current implementation already exposes `unread_count` from the notification API.
3. Add end-to-end tests for creating a ticket, uploading an image, administrator reply, permission isolation, notification delivery, and email delivery.
4. Before production deployment, configure `SESSION_COOKIE_SECURE=true`, a trusted proxy list, HTTPS, a persistent `/data` volume, and a transactional SMTP provider if email verification is enabled. For Brevo SMTP, use `smtp-relay.brevo.com`, port `587`, disable implicit SSL, enable STARTTLS, set the account to the Brevo SMTP login, set the From address to an address on a verified domain, and use a Brevo SMTP key as the token. Never commit these credentials.
