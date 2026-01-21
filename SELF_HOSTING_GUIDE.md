# Marketing Control Center - Self-Hosting Guide

## ZERO MANUS DEPENDENCIES

This application is **fully portable** and can be deployed on any infrastructure without any Manus dependencies.

---

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd marketing-control-center

# Install dependencies
pnpm install

# Set up environment variables (see below)
cp .env.example .env

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing (min 32 chars) | `your-super-secret-key-at-least-32-chars` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD_HASH` | SHA-256 hash of admin password | See "Generate Password Hash" below |

### Database (Optional - for local storage)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |

### Just Talk Integration (Optional - for live data)

| Variable | Description | Example |
|----------|-------------|---------|
| `JUST_TALK_DATABASE_URL` | PostgreSQL connection to Just Talk | `postgresql://user:pass@host:5432/db?sslmode=require` |

### OpenAI (Optional - for AI features)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |

### AWS S3 (Optional - for file storage)

| Variable | Description | Example |
|----------|-------------|---------|
| `S3_BUCKET` | S3 bucket name | `my-bucket` |
| `S3_REGION` | AWS region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `S3_ENDPOINT` | Custom S3 endpoint (for MinIO, DigitalOcean Spaces) | `https://nyc3.digitaloceanspaces.com` |

### Twilio (Optional - for notifications)

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `...` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for SMS | `+1234567890` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | `+1234567890` |
| `OWNER_PHONE_NUMBER` | Your phone number for alerts | `+1234567890` |

---

## Generate Password Hash

To generate the admin password hash:

```bash
# Using Node.js
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"

# Or using the API (development only)
curl -X POST http://localhost:3000/api/trpc/auth.generateHash \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}'
```

---

## Deployment Options

### Option 1: Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`
5. Add environment variables in Render dashboard

### Option 2: Railway

1. Create new project from GitHub
2. Railway auto-detects Node.js
3. Add environment variables
4. Deploy

### Option 3: DigitalOcean App Platform

1. Create new App from GitHub
2. Select Node.js environment
3. Configure environment variables
4. Deploy

### Option 4: Self-Hosted (VPS/Docker)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
docker build -t marketing-control-center .
docker run -p 3000:3000 --env-file .env marketing-control-center
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Marketing Control Center                     │
│                 (Zero Manus Dependencies)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Frontend   │  │   Backend    │  │   Database   │       │
│  │   (React)    │  │   (Express)  │  │   (MySQL)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Direct Integrations                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ OpenAI  │ │   S3    │ │ Twilio  │ │Just Talk│    │   │
│  │  │ (LLM)   │ │(Storage)│ │ (SMS)   │ │  (DB)   │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### Autonomous Marketing Intelligence

1. **Real-Time Analytics** - Live data from Just Talk (READ-ONLY)
2. **AI Recommendations** - OpenAI-powered content analysis
3. **A/B Testing** - Statistical significance calculation
4. **Auto-Optimization** - Automatic pause/boost based on performance
5. **Self-Reporting** - Daily summaries via SMS/WhatsApp

### Authentication

- Simple JWT-based authentication
- No external OAuth dependencies
- Configurable admin credentials

### Notifications

- Direct Twilio integration
- SMS and WhatsApp support
- No proxy dependencies

---

## Security Notes

1. **JWT_SECRET**: Use a strong, random secret (min 32 characters)
2. **ADMIN_PASSWORD_HASH**: Never commit the plain password
3. **Database**: Use SSL connections in production
4. **HTTPS**: Always use HTTPS in production

---

## Troubleshooting

### "Database not available"
- Check `DATABASE_URL` is set correctly
- Verify database server is running
- Check SSL settings for cloud databases

### "OpenAI not configured"
- Set `OPENAI_API_KEY` environment variable
- Verify API key is valid

### "Twilio not configured"
- Set all Twilio environment variables
- Verify Twilio credentials are correct

---

## License

MIT License - Use freely, modify as needed.

---

## Support

This is a self-contained application. For issues:
1. Check environment variables
2. Review server logs
3. Verify database connections
