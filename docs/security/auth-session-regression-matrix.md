# WaveLab Authentication and Session Security Regression Matrix

This matrix is the release gate for the authentication/session hardening branch. Automated coverage should be supplemented by the manual and deployment checks below before merging into `dev`.

## Required repository checkpoint

Run from the repository root:

```text
npm run quality

cd backend
npm test

cd ../frontend
npm test
npm run build
```

Do not mark the branch green unless the checkpoint passes locally or the equivalent CI jobs pass.

## Authentication and account state

| Scenario                              | Expected result                                                                                        | Verification                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Correct login                         | Active, verified account authenticates and receives valid access/refresh state                         | Backend regression + manual smoke |
| Wrong password                        | Generic `Invalid email or password.`; failure counters/lockout still apply                             | Backend regression                |
| Unknown email                         | Same externally visible credential failure shape as wrong password; dummy bcrypt work is performed     | Backend regression                |
| Temporary lockout                     | Locked account is rejected until lock expiry                                                           | Backend regression                |
| Expired lock recovery                 | Expired temporary lock is cleared and normal authentication can resume                                 | Backend regression                |
| Suspended/inactive user               | Authentication/session checks reject unavailable account state                                         | Backend regression + manual smoke |
| Unverified user                       | Login remains blocked until verification completes                                                     | Backend regression                |
| Registration duplicate username/email | Same HTTP status and generic response as accepted registration; no direct account-existence disclosure | Backend regression                |
| Registration race duplicate           | Database uniqueness race returns the same generic accepted response                                    | Backend regression                |

## OTP and trusted devices

| Scenario               | Expected result                                                                    | Verification                      |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------- |
| OTP send               | OTP is generated only for eligible pending auth state and is rate limited          | Backend regression                |
| OTP verification       | Valid OTP completes second factor                                                  | Backend regression                |
| OTP expiry             | Expired OTP is rejected                                                            | Backend regression                |
| OTP brute force        | Invalid attempts are bounded by OTP verification limits                            | Backend regression                |
| Verification resend    | Per-email resend limiting uses Redis rather than process memory                    | Backend regression + Redis smoke  |
| Trusted-device issue   | Successful OTP verification issues opaque httpOnly credential; only hash is stored | `trustedDevice.test.js`           |
| Trusted-device consume | User-Agent and `sessionVersion` must match; credential is one-time rotated         | `trustedDevice.test.js`           |
| Trusted-device logout  | Current credential is revoked server-side and cookie is cleared                    | Backend regression + manual smoke |
| Logout all devices     | All refresh sessions and trusted devices are revoked; `sessionVersion` changes     | Backend regression + manual smoke |

## Refresh and session invalidation

| Scenario                           | Expected result                                                                                                                                                                                                                              | Verification                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Refresh rotation                   | A refresh token is consumed once and replaced within the same family                                                                                                                                                                         | Existing backend regression                                                          |
| Refresh reuse                      | Reuse marks/revokes the refresh family as compromised                                                                                                                                                                                        | Existing backend regression                                                          |
| Concurrent refresh                 | Concurrent rotation cannot create multiple valid descendants                                                                                                                                                                                 | Existing backend regression                                                          |
| Password change                    | Password update is conditional on the verified password hash; model updates `passwordChangedAt` and `sessionVersion`; stored refresh/trusted credentials are revoked; auth cookies are cleared; active sockets disconnect; re-login required | `passwordChangeRace.test.js` + `securitySessionRevocation.test.js` + manual smoke    |
| Verified email change              | Pending identity is promoted atomically; `sessionVersion` increments; stored refresh/trusted credentials are revoked; auth cookies are cleared; active sockets disconnect; re-login with new email required                                  | `emailVerificationRace.test.js` + `securitySessionRevocation.test.js` + manual smoke |
| Direct admin role/email change     | Security-sensitive account change increments session state and revokes stored credentials; active sockets disconnect                                                                                                                         | Backend regression/manual admin smoke                                                |
| Account status change              | Changed account availability invalidates sessions and disconnects active sockets                                                                                                                                                             | Backend regression/manual admin smoke                                                |
| Role permission change             | All users assigned to the changed role get a `sessionVersion` increment, refresh/trusted-device revocation, and active-socket disconnect                                                                                                     | Backend regression/manual RBAC smoke                                                 |
| Session-version mismatch           | HTTP and Socket.IO authentication reject stale JWTs                                                                                                                                                                                          | Backend regression                                                                   |
| Password-change timestamp mismatch | Tokens issued before password change are rejected                                                                                                                                                                                            | Backend regression                                                                   |

## Realtime authorization

| Scenario                   | Expected result                                                                                        | Verification                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Socket.IO authentication   | HS512 access JWT, active/non-deleted account, password-change time, and `sessionVersion` are enforced  | Backend regression                                           |
| Socket expiry              | Connected client is disconnected when access JWT reaches expiry                                        | Backend regression/manual socket smoke                       |
| Project room authorization | `forecast:join_project` uses existing project access rules and rejects unauthorized project IDs/users  | Backend regression/manual multi-user smoke                   |
| Security-state revocation  | Password/email/role/permission/status invalidation disconnects sockets in the user's Redis-backed room | `securitySessionRevocation.test.js` + manual multi-tab smoke |

## Request security and failure handling

| Scenario                     | Expected result                                                                                                                              | Verification                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| CSRF failure                 | Security-sensitive cookie-authenticated mutation without valid signed CSRF token is rejected                                                 | Backend regression                                 |
| Trusted-device CSRF handling | Presence of trusted-device cookie is treated as security-sensitive cookie auth                                                               | Backend regression                                 |
| Wrong CORS origin            | Production request from an origin outside the exact allowlist is rejected                                                                    | Backend/config regression + deployment smoke       |
| Production configuration     | Startup fails for weak/shared JWT/refresh/CSRF secrets, insecure cookies, missing origins, wildcard origins, or non-HTTPS production origins | Backend config regression                          |
| Auth backend unavailable     | Public login/auth routes remain reachable while session verification failure does not expose protected routes                                | Frontend regression + failure smoke                |
| Auth request timeout         | `/api/auth/check` and `/refresh-token` abort after 10 seconds                                                                                | Frontend regression                                |
| Nginx proxy boundary         | Production backend binds to `127.0.0.1`; Express trusts loopback proxy addresses; Nginx is the only public HTTP/WebSocket hop                | Deployment inspection + host firewall/socket check |

## Rate-limit architecture

The endpoint-specific `express-rate-limit` stores are process-local. This is acceptable only while production runs a single systemd backend process. Before adding a second backend process, container replica, or load-balanced node, migrate the global/auth endpoint limiters to a shared Redis-backed store so limits cannot be bypassed by distributing requests across instances.

The verification-resend per-email limiter is already Redis-backed and should remain shared.

## Merge gate

Before opening or marking the PR ready:

- Full repository checkpoint passes locally or in CI.
- Login, OTP, trusted-device, password-change, email-change, RBAC change, logout-all, and Socket.IO flows receive a focused smoke test.
- Production env uses `BIND_HOST=127.0.0.1`, HTTPS, secure cookies, separate JWT/refresh/CSRF secrets, and exact HTTPS CORS origins.
- Nginx is confirmed as the only public path to the backend.
- No authentication/session regression is waived without documenting the reason and follow-up.
