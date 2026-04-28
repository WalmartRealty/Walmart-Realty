'use strict';

/**
 * ip-allowlist.js
 *
 * Network-layer guard for the Walmart Realty admin panel.
 * Blocks any request that doesn't originate from an approved CIDR range
 * (Walmart Eagle WiFi or corporate VPN).
 *
 * Pure Node.js — zero external dependencies.
 *
 * Usage in server.js:
 *   const { ipAllowlist } = require('./middlewares/ip-allowlist');
 *   app.use('/admin',     ipAllowlist);
 *   app.use('/api/auth',  ipAllowlist);
 *
 * Required env var:
 *   ALLOWED_ADMIN_CIDRS — comma-separated IPv4 CIDR blocks, e.g.:
 *     ALLOWED_ADMIN_CIDRS=10.32.0.0/11,192.168.1.0/24,127.0.0.1/32
 *
 * Required Express config (set BEFORE this middleware runs):
 *   app.set('trust proxy', 1)
 *   — tells Express to read the real client IP from X-Forwarded-For
 *     when sitting behind Azure's load balancer or nginx.
 */

// ── IPv4 helpers ──────────────────────────────────────────────────────────────

/**
 * Convert a dotted-decimal IPv4 string to an unsigned 32-bit integer.
 * @param {string} ip  e.g. '10.32.5.1'
 * @returns {number}
 */
function ipv4ToInt(ip) {
    return ip
        .split('.')
        .reduce((acc, octet) => (acc << 8) | (parseInt(octet, 10) & 0xff), 0) >>> 0;
}

/**
 * Strip the IPv4-mapped IPv6 prefix (::ffff:) so the rest of the logic
 * only ever deals with plain dotted-decimal IPv4.
 * @param {string} raw  e.g. '::ffff:10.32.5.1'
 * @returns {string}    e.g. '10.32.5.1'
 */
function normalizeIp(raw) {
    if (typeof raw !== 'string') return '';
    if (raw.startsWith('::ffff:')) return raw.slice(7);
    return raw;
}

/**
 * Return true if `ip` falls within the given IPv4 `cidr` block.
 * @param {string} ip    Dotted-decimal IPv4 address
 * @param {string} cidr  e.g. '10.0.0.0/8'
 * @returns {boolean}
 */
function isInCidr(ip, cidr) {
    const [network, bits] = cidr.split('/');
    const prefix = parseInt(bits, 10);

    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    // A /0 prefix matches everything — still valid (open allowlist entry)
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

// ── CIDR list loader ──────────────────────────────────────────────────────────

/**
 * Parse ALLOWED_ADMIN_CIDRS from the environment.
 * Falls back to localhost-only so local dev always works out of the box.
 *
 * NOTE: In production, this MUST be set to Walmart's Eagle/VPN CIDR ranges.
 *       Contact the Walmart Network team for the authoritative list.
 *       Leaving the default in production will silently allow only localhost.
 * @returns {string[]}
 */
function getAllowedCidrs() {
    const raw = process.env.ALLOWED_ADMIN_CIDRS || '127.0.0.1/32';
    return raw
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Express middleware — returns 403 if the client IP is not in the allowlist.
 *
 * IP resolution order (first match wins):
 *   1. X-Forwarded-For header — leftmost entry is the real client IP
 *      (set by Azure Application Gateway / nginx)
 *   2. req.ip — Express's resolved IP (accurate when trust proxy is set)
 *
 * @type {import('express').RequestHandler}
 */
function ipAllowlist(req, res, next) {
    // ── Resolve real client IP ────────────────────────────────────────────
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = forwarded
        ? forwarded.split(',')[0].trim()   // leftmost = original client
        : (req.ip || '');
    const clientIp = normalizeIp(rawIp);

    // ── IPv6 localhost — always permit (local dev) ────────────────────────
    if (clientIp === '::1') return next();

    // ── Check against allowlist ───────────────────────────────────────────
    const cidrs = getAllowedCidrs();
    const allowed = cidrs.some(cidr => {
        try {
            return isInCidr(clientIp, cidr);
        } catch {
            // Malformed CIDR in env var — log and skip rather than crash
            console.error(`[ip-allowlist] Bad CIDtry skipped: "${cidr}"`);
            return false;
        }
    });

    if (allowed) return next();

    console.warn(
        `[SECURITY] Admin access denied — ${clientIp} is not on the Walmart network. ` +
        `Route: ${req.method} ${req.path}`
    );

    return res.status(403).json({
        error: 'Access restricted. Connect to Walmart Eagle WiFi or VPN and try again.',
    });
}

module.exports = { ipAllowlist, isInCidr, normalizeIp }; // export helpers for unit tests
