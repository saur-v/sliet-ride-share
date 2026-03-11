# GENERATION CHECKLIST
> Use this to verify the implementation is complete before shipping.

## API & Documentation
- [x] All APIs implemented (`/api/v1/auth/*`, `/api/v1/groups/*`, `/api/v1/users/*`, `/api/v1/notifications/*`, `/api/v1/admin/*`)
- [x] OpenAPI/Swagger spec present at `server/openapi.yaml`
- [x] All routes documented with request/response schemas and examples

## Database
- [x] All schemas created: User, Group, Membership, Notification, ChatMessage, AuditLog
- [x] Correct indexes on all collections (email, collegeId, date+time, groupId+userId unique)
- [x] Seed script at `server/src/seed/seed.js` — creates 1 admin, 5 students, 10 groups
- [x] `npm run seed` works from the server directory

## Auth & Security
- [x] College email domain validation (`@sliet.ac.in` enforced server-side)
- [x] Email verification (magic link) before access
- [x] JWT access tokens (15m) + refresh token rotation (7d, hashed in DB)
- [x] `emailVerified` + `contactNo` + `hostelNo` + `collegeId` required before join/create
- [x] Passwords hashed with bcryptjs (cost >= 12 when set)
- [x] Rate limiting on auth endpoints (express-rate-limit)
- [x] Input validation with express-validator on all routes
- [x] CORS restricted to FRONTEND_URL
- [x] Helmet security headers enabled

## Group & Seat Logic
- [x] Atomic seat enforcement via `findOneAndUpdate` with `$expr` condition + MongoDB transaction
- [x] Cannot set seatsTotal < seatsTaken on update
- [x] `seatsRemaining` virtual on Group model
- [x] Creator auto-joins on group creation (seatsTaken starts at 1)
- [x] Leave decrements seatsTaken atomically
- [x] Kick decrements seatsTaken
- [x] Group expiry cron job (`jobs/cleanup.js`) marks past groups as completed

## Socket.IO
- [x] Socket.IO server initialised with JWT auth middleware
- [x] Per-group rooms (`group:<id>`)
- [x] `group:created` event emitted on creation
- [x] `group:updated` event emitted on update/cancel
- [x] `group:member_joined` event with correct payload
- [x] `group:member_left` event
- [x] `group:confirmed` event with vehicleInfo + member list
- [x] `chat:message` event — server validates membership before broadcasting
- [x] `chat:send` client event handled server-side
- [x] Polling fallback built in (`transports: ['websocket', 'polling']`)
- [x] Redis adapter documented in README (optional, for scaling)

## Privacy / PII
- [x] `contactNo` hidden from non-members in group member endpoints
- [x] `contactNo` hidden in public user profile unless shared group member
- [x] `contactNo` only revealed in socket `group:confirmed` payload to members

## Frontend
- [x] All pages: Landing, Login, Register, Verify, Dashboard, Browse, Create, GroupDetails, Profile, MyGroups, Admin
- [x] All components: GroupCard, MemberList, ChatBox, Navbar, ProtectedRoute
- [x] AuthContext: global user state, login/logout/refresh
- [x] SocketContext: single connection per session, group subscription helpers
- [x] `services/api.js`: axios with auto-refresh interceptor on 401
- [x] `ProtectedRoute` blocks: unauthenticated, unverified, incomplete profile, non-admin
- [x] `GroupCard` shows "expiring soon" badge when ride < EXPIRY_SOON_HOURS away
- [x] TailwindCSS configured with custom component classes
- [x] Mobile-first responsive design

## Notifications
- [x] DB notifications created for: member_joined, group_confirmed, group_cancelled
- [x] Notification bell in Navbar with unread count badge
- [x] Mark-all-read on dropdown open
- [x] Email notifications for group confirmed and cancelled

## Admin
- [x] Admin panel page with Overview / Users / Audit Logs tabs
- [x] Suspend/unsuspend users
- [x] Cancel groups
- [x] Audit log collection — every admin action is logged
- [x] `requireAdmin` middleware on all `/api/v1/admin/*` routes

## Tests
- [x] Unit tests: `tokens.test.js` — all token utilities
- [x] Integration tests: `auth.test.js` — register, verify, login flows
- [x] Integration tests: `groups.test.js` — full group lifecycle
- [x] Concurrency test: `join.concurrent.test.js` — 10 simultaneous joins, only seatsTotal succeed
- [x] Frontend unit tests: `GroupCard.test.jsx`, `ProtectedRoute.test.jsx`
- [x] E2E Cypress tests: `full-flow.cy.js`, `register.cy.js`

## CI/CD
- [x] GitHub Actions at `.github/workflows/ci.yml`
- [x] Steps: server tests → client build → E2E (main only) → deploy
- [x] Cypress E2E in CI
- [x] Deploy hooks for Render

## Deployment & Infrastructure
- [x] `server/Dockerfile`
- [x] `docker-compose.yml` with MongoDB + Redis + server + client
- [x] `render.yaml` for Render.com deployment
- [x] `.env.example` with all variables documented
- [x] `.gitignore` correctly excludes secrets and build artifacts
- [x] `README.md` with setup, dev, test, and deploy instructions

## Code Quality
- [x] ESLint config (`server/.eslintrc.cjs`)
- [x] Prettier config (`.prettierrc`)
- [x] All controllers use centralised logger (Winston)
- [x] Config module (`server/src/config/index.js`) — no raw `process.env` in controllers
- [x] Meaningful HTTP status codes and `{ errorCode, message }` error bodies

## Optional / Advanced (documented, not implemented by default)
- [ ] Redis Socket.IO adapter — documented in README, requires `REDIS_URL` env var
- [ ] Twilio SMS — `server/src/services/sms.js` present, opt-in via env vars
- [ ] Map integration — documented in README as optional
- [ ] Payments (Razorpay/Stripe) — documented in README
- [ ] Ratings/feedback — documented in README
- [ ] Waitlist — documented in README
- [ ] Live location tracking — documented in README with privacy note
