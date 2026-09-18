# OWASP ASVS 5.0 Level 2 Traceability

## Requirements Mapping

### V1: Architecture, Design, and Threat Modeling
- [x] Threat model documented (PROJECT_AUDIT.md §4)
- [x] Data-flow diagram created (audit documents)
- [x] Trust boundaries identified (REMEDIATION_PLAN.md §3)

### V2: Authentication
- [x] Google-only authentication via Supabase Auth
- [x] PKCE flow implemented
- [x] Opaque server sessions
- [ ] MFA enforcement (AAL2) - pending provider verification
- [ ] Session fixation protection - implemented via session rotation

### V3: Session Management
- [x] Session expiration and renewal
- [x] Global logout
- [x] Session rotation after privilege changes
- [ ] Concurrent session limit - pending

### V4: Access Control
- [x] Role-based access control (customer, order_manager, admin, super_admin)
- [x] Staff allowlist enforcement
- [x] Ownership verification on all order operations
- [ ] IDOR testing - pending test implementation

### V5: Input Validation
- [x] Zod-style validation in API endpoints
- [x] Quantity bounds enforced
- [x] Idempotency keys required
- [ ] Schema validation tests - pending

### V6: Error Handling
- [x] Consistent error envelopes
- [x] No stack traces in production responses
- [ ] Request ID tracking - implemented

### V7: Cryptography
- [x] Supabase Auth JWT verification
- [ ] Session encryption at rest - pending
- [ ] Envelope encryption for sensitive data - pending

### V8: Logging and Monitoring
- [x] Audit logs implemented
- [x] Structured logging
- [ ] Alert thresholds - pending operational configuration

### V9: Data Protection
- [x] Privacy request workflow
- [x] Consent versioning
- [ ] Retention jobs - pending worker implementation

## Level 3 Controls (Risk-Selected)
- Payment processing (V10-V11)
- Staff security management (V4.5)
- Secrets management (V7.2)

## Gap Analysis
Pending items marked [ ] require external inputs (Supabase credentials, provider MFA, deployment configuration).
