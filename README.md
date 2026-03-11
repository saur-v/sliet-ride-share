# 🚗 SLIET RideShare

A student-only ridesharing platform for SLIET campus. Share autos/cabs to Sangrur with verified classmates, coordinate in realtime, and split costs.

---

## 🗂 Project Structure

```
sliet-ride-share/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm

### 1. Clone & install

```bash
git clone https://github.com/yourname/sliet-ride-share.git
cd sliet-ride-share

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, SMTP_* at minimum
```

### 3. Run with Docker Compose (easiest)

```bash
docker-compose up
# Server: http://localhost:5000
# Client: http://localhost:5173
```

### 4. OR run manually

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

### 5. Seed test data

```bash
cd server && npm run seed
# Creates: 1 admin + 5 students + 10 groups
# Login: aman@sliet.ac.in / Test@1234
# Admin: admin@sliet.ac.in / Test@1234
```

---

## 🌐 Environment Variables

See `.env.example` for full list. Minimum required:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `SMTP_HOST/PORT/USER/PASS` | Email sending config |
| `FRONTEND_URL` | Client URL (for CORS + email links) |
| `COLLEGE_EMAIL_DOMAIN` | e.g. `sliet.ac.in` |

---

## 🧪 Tests

```bash
# Server unit + integration tests
cd server && npm test

# The critical concurrent-join test
cd server && npm test -- --testPathPattern=join.concurrent
```

---

## 🚀 Deploy to Render

1. Push to GitHub
2. Create two services on [render.com](https://render.com):
   - **Web Service** (server/): `npm start`, set all env vars
   - **Static Site** (client/): `npm run build`, publish `dist/`
3. Add `RENDER_DEPLOY_HOOK_SERVER` and `RENDER_DEPLOY_HOOK_CLIENT` to GitHub Secrets for auto-deploy on push to `main`

---

## 🔌 Socket.IO Scaling (Redis Adapter)

For multi-instance deployments:

```bash
npm install @socket.io/redis-adapter ioredis
```

```js
// In server/src/services/socket.js
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'ioredis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

Set `REDIS_URL` in your environment to enable.

---

## 📋 API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | - | Register with college email |
| POST | `/api/v1/auth/verify-email` | - | Verify magic link token |
| POST | `/api/v1/auth/login` | - | Login |
| POST | `/api/v1/auth/refresh` | - | Refresh token rotation |
| GET  | `/api/v1/groups` | - | Browse groups |
| POST | `/api/v1/groups` | ✅ + profile | Create group |
| POST | `/api/v1/groups/:id/join` | ✅ + profile | Join group (atomic) |
| POST | `/api/v1/groups/:id/confirm` | creator | Confirm booking |
| GET  | `/api/v1/notifications` | ✅ | Get notifications |

---

## 🔒 Security Notes

- All auth endpoints are rate-limited (10 req/15min per IP)
- Access tokens expire in 15 minutes; refresh tokens in 7 days
- Refresh tokens are stored hashed (SHA-256) in MongoDB
- Contact numbers are hidden from non-members at the API level
- All inputs are validated server-side via express-validator
- CORS restricted to `FRONTEND_URL`

---

## 🧪 Running Tests

```bash
# Unit + integration (server)
cd server && npm test

# The concurrency test specifically
cd server && npm test -- --testPathPattern=join.concurrent

# Frontend component tests
cd client && npm test

# E2E (requires running server + client)
cd client && npx cypress open     # interactive
cd client && npx cypress run      # headless
```

---

## 📡 Socket.IO Events Reference

| Event (server → client) | When fired | Key payload fields |
|---|---|---|
| `group:created` | New group created | `{ group }` |
| `group:updated` | Group updated/cancelled | `{ group }` |
| `group:member_joined` | Someone joins | `{ groupId, user, seatsRemaining }` |
| `group:member_left` | Someone leaves/kicked | `{ groupId, userId }` |
| `group:confirmed` | Creator confirms | `{ groupId, vehicleInfo, meetingPoint, members }` |
| `chat:message` | New chat message | `{ groupId, message: { id, userId, user, text, createdAt } }` |

| Event (client → server) | Purpose |
|---|---|
| `subscribe:group` | Join a socket room for a group |
| `unsubscribe:group` | Leave a socket room |
| `chat:send` | Send a chat message (validated server-side) |

---

## 🔧 Optional Features

### Redis Socket.IO Scaling
```bash
npm install @socket.io/redis-adapter ioredis   # in server/
```
Set `REDIS_URL` env var. See `server/src/services/socket.js` for the adapter code.

### SMS Notifications (Twilio)
Set `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE` in `.env`.
SMS will automatically fire for confirmed/cancelled groups.
See `server/src/services/sms.js`.

### Map Integration
Embed a Google Maps iframe or use Leaflet/OpenStreetMap with the `meetingPoint` coordinates.
Add a `meetingPointLatLng` field to the Group schema and display on GroupDetails page.

### Payments (Razorpay)
1. Add `seatPrice` field (already in schema)
2. Create a Razorpay order on `POST /groups/:id/join`
3. Verify payment on webhook before creating membership
4. Distribute collected amount to creator's account

### Ratings
Add a `Rating` schema `{ groupId, fromUserId, toUserId, score, comment }`.
Expose `GET /users/:id/ratings` and `POST /groups/:id/rate` after group completes.

### Waitlist
Change `POST /groups/:id/join` to create a membership with `status: 'pending'` when seats are full.
Add `POST /groups/:id/waitlist-accept` for creator to promote waitlisted members.

### Live Location Sharing (opt-in only)
Add a `location` Socket.IO event that broadcasts position to group members.
Never store location in DB. Only active during confirmed rides.
Require explicit user opt-in per ride.
