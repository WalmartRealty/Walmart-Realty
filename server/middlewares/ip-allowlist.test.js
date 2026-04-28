'use strict';

/**
 * Unit tests for ip-allowlist.js
 * Run with: node server/middlewares/ip-allowlist.test.js
 */

const { isInCidr, normalizeIp } = require('./ip-allowlist');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
    if (actual === expected) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label} — expected ${expected}, got ${actual}`);
        failed++;
    }
}

// ── normalizeIp ───────────────────────────────────────────────────────────────
console.log('\nnormalizeIp:');
assert('strips ::ffff: prefix',       normalizeIp('::ffff:10.0.0.1'),  '10.0.0.1');
assert('leaves plain IPv4 alone',     normalizeIp('192.168.1.5'),       '192.168.1.5');
assert('leaves ::1 alone',            normalizeIp('::1'),               '::1');
assert('handles undefined gracefully',normalizeIp(undefined),           '');

// ── isInCidr ──────────────────────────────────────────────────────────────────
console.log('\nisInCidr — host matches:');
assert('10.0.0.1 in 10.0.0.0/8',         isInCidr('10.0.0.1',    '10.0.0.0/8'),      true);
assert('10.255.255.255 in 10.0.0.0/8',   isInCidr('10.255.255.255','10.0.0.0/8'),    true);
assert('127.0.0.1 in 127.0.0.1/32',      isInCidr('127.0.0.1',   '127.0.0.1/32'),    true);
assert('192.168.5.10 in 192.168.5.0/24', isInCidr('192.168.5.10','192.168.5.0/24'),  true);

console.log('\nisInCidr — host outside range:');
assert('11.0.0.1 NOT in 10.0.0.0/8',      isInCidr('11.0.0.1',  '10.0.0.0/8'),      false);
assert('192.168.6.1 NOT in 192.168.5.0/24',isInCidr('192.168.6.1','192.168.5.0/24'),false);
assert('192.168.1.1 NOT in 10.0.0.0/8',   isInCidr('192.168.1.1','10.0.0.0/8'),      false);

console.log('\nisInCidr — edge cases:');
assert('/32 exact match passes',    isInCidr('10.0.0.1', '10.0.0.1/32'), true);
assert('/32 exact match fails',     isInCidr('10.0.0.2', '10.0.0.1/32'), false);
assert('/0 matches everything',     isInCidr('8.8.8.8',  '0.0.0.0/0'),   true);
assert('bad prefix returns false',  isInCidr('10.0.0.1', '10.0.0.0/99'), false);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
