# Security Policy

## Supported Versions

| Version | Supported          |
|---------|---------------------|
| 0.1.x   | ✅ Yes              |
| < 0.1   | ❌ No               |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in ARTH.OS, please follow the process below.

**Do NOT open a public GitHub issue for security vulnerabilities.** Instead, email us directly or use the GitHub Security Advisory system.

### How to report

1. **Email:** Send the details to the project maintainer listed in the repository
2. **GitHub Advisory:** Navigate to the repository → Security → Report a vulnerability

### What to include

- **Type of vulnerability** (e.g., SQL injection, XSS, auth bypass)
- **Steps to reproduce** — minimal, complete, verifiable example
- **Affected versions** — which versions are impacted
- **Impact** — what an attacker could do
- **Suggested fix** — if you have one (optional but appreciated)

### What to expect

- **Acknowledgement** within 48 hours
- **Status update** every 5 business days until resolution
- **CVE assignment** for confirmed vulnerabilities
- **Credit** in the release notes (if you consent)

## Security Measures

### Data protection

- **No PII stored** in analytics/telemetry — only aggregate numeric scores
- **Supabase** — database access restricted to service-role key only
- **Stripe** — payment data never touches our servers; Stripe Elements handles card details
- **JWT tokens** — signed with HS256, configurable via `JWT_SECRET` environment variable

### Authentication & Authorization

- JWT-based authentication with bearer tokens
- All `/api/user/*` endpoints require valid JWT
- Role-based access for `/api/b2b/admin` endpoints
- Stripe webhooks validated via HMAC-SHA256 signature verification

### API security

- CORS configured via Vercel
- Content-Security-Policy headers set in `vercel.json`
- Input validation on all API endpoints (JSON parsing errors return 400)
- Rate limiting should be configured at the infrastructure level (Vercel WAF, Cloudflare)

### Environment variables

The following secrets **must** be kept confidential and never committed to version control:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Token signing key |
| `SUPABASE_SERVICE_ROLE_KEY` | Database admin access |
| `STRIPE_SECRET_KEY` | Stripe API operations |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |

## Security Checklist for Deployments

Before deploying to production, verify:

- [ ] `JWT_SECRET` is set to a strong, unique value (not the development default)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set to a production key (not development)
- [ ] Stripe keys are production keys (not test keys)
- [ ] CORS origins are restricted in Vercel/API gateway
- [ ] HTTPS is enforced (Vercel does this by default)
- [ ] Database backups are configured
- [ ] Monitoring/alerting is in place

## Known Security Considerations

1. **Rate limiting:** Not currently implemented at the application level. Should be configured via Vercel WAF or a reverse proxy.
2. **Password hashing:** Uses bcryptjs with default salt rounds. Consider increasing salt rounds for production.
3. **API key rotation:** No built-in key rotation mechanism. Manual rotation required.
4. **Session management:** JWT tokens have no expiration by default. Set `expiresIn` when issuing tokens in production.

---

*Last updated: June 2026*
