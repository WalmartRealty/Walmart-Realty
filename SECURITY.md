# 🔒 Security Documentation

## Walmart Real Estate Platform Security

This document outlines the security measures implemented in the Walmart Real Estate platform.

---

## Security Features Implemented

### 1. Authentication & Authorization

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 rounds |
| JWT Tokens | HS256, 8-hour expiration |
| Token Validation | Issuer/audience verification |
| Session Management | Stateless JWT with DB validation |

### 2. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 minutes |
| API calls | 100 requests | 1 minute |
| File uploads | 50 uploads | 1 hour |

### 3. Input Validation

- All user inputs sanitized
- SQL injection prevented via parameterized queries
- File upload type validation (whitelist approach)
- File extension verification matches MIME type

### 4. HTTP Security Headers (via Helmet)

```
Content-Security-Policy: Restricts resource loading
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 5. File Upload Security

- **Whitelist**: Only jpg, jpeg, png, gif, pdf, doc, docx
- **Size Limit**: 10MB per file, 5 files per request
- **Filename Sanitization**: Path traversal prevention
- **MIME Type Validation**: Extension must match content type

---

## Password Requirements

Passwords must meet ALL of the following:

- ✅ Minimum 12 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*(),.?":{}|<>)

---

## Environment Variables

**⚠️ CRITICAL: Never commit `.env` files to version control!**

Required for production:

```bash
JWT_SECRET=<64+ character random string>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
```

Generate a secure JWT secret:
```bash
openssl rand -hex 64
```

---

## Deployment Checklist

### Before Production

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (64+ chars)
- [ ] Change default admin password
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable HTTPS (TLS 1.2+)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Remove any test/demo data
- [ ] Configure proper logging
- [ ] Set up monitoring/alerting

### Infrastructure

- [ ] Use a reverse proxy (nginx/Apache)
- [ ] Enable firewall rules
- [ ] Configure DDoS protection
- [ ] Set up automated backups
- [ ] Implement log rotation

---

## Security Audit

Run security audit:
```bash
cd server
npm audit
npm audit fix
```

---

## Incident Response

If you suspect a security breach:

1. **Immediately** rotate JWT_SECRET
2. Invalidate all actis
3. Review activity logs
4. Contact Walmart InfoSec team
5. Document the incident

---

## Compliance Notes

This application should be reviewed by Walmart's:

- Information Security team
- Compliance team (for data handling)
- Legal team (for PII considerations)

Before deploying to production with real property data.

---

## Contact

For security concerns, contact:
- Walmart InfoSec: infosec@walmart.com
- Application Owner: [Your Contact]

---

*Last Updated: April 2026*
