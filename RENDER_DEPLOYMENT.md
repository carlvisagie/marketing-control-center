# Marketing Control Center - Render Deployment Guide

## GitHub Repository
**URL:** https://github.com/carlvisagie/marketing-control-center

---

## Step-by-Step Render Deployment

### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select **`carlvisagie/marketing-control-center`** repository

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `marketing-control-center` |
| **Region** | Same as Just Talk (e.g., Oregon) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance Type** | Free (or Starter for better performance) |

### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

#### Required
```
JWT_SECRET=<generate-a-32-char-random-string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<sha256-hash-of-your-password>
```

To generate password hash:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
```

#### Just Talk Integration (for live data)
```
JUST_TALK_DATABASE_URL=<your-just-talk-postgres-url>
```
(Get this from your Just Talk Render service → Environment)

#### AI Features (optional)
```
OPENAI_API_KEY=sk-...
```

#### Notifications (optional)
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
OWNER_PHONE_NUMBER=+1234567890
```

### 4. Deploy

Click **"Create Web Service"**

Render will:
1. Clone the repo
2. Install dependencies
3. Build the app
4. Start the server

### 5. Access Your App

Once deployed, your Marketing Control Center will be available at:
```
https://marketing-control-center.onrender.com
```

---

## Post-Deployment

### Login
1. Go to your Render URL
2. Login with `ADMIN_USERNAME` and the password you hashed

### Connect to Just Talk Data
1. Copy `DATABASE_URL` from your Just Talk Render service
2. Add it as `JUST_TALK_DATABASE_URL` in Marketing Control Center
3. Redeploy

---

## Troubleshooting

### "Build failed"
- Check that `pnpm` is being used (not npm)
- Verify Node version is 18+

### "Cannot connect to database"
- Verify `JUST_TALK_DATABASE_URL` includes `?sslmode=require`
- Check the URL is correct (no typos)

### "Login not working"
- Verify `ADMIN_PASSWORD_HASH` is correct SHA-256 hash
- Check `JWT_SECRET` is set

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     RENDER                               │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │    Just Talk     │    │ Marketing Control │          │
│  │   (Production)   │◄───│     Center        │          │
│  │                  │    │   (READ-ONLY)     │          │
│  └──────────────────┘    └──────────────────┘          │
│           │                       │                     │
│           ▼                       ▼                     │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   PostgreSQL     │    │  Direct APIs     │          │
│  │   (Just Talk)    │    │  OpenAI/Twilio   │          │
│  └──────────────────┘    └──────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

Marketing Control Center reads from Just Talk's database but never writes to it.
