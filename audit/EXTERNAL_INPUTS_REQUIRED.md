# External inputs required to close the remaining checklist items

The repository implementation and UI are complete for the selected scope. These items cannot be completed or truthfully marked verified from source code alone:

1. **Supabase server access:** `SUPABASE_SECRET_KEY` or a pooled `DATABASE_URL` for the supplied project. The publishable key is intentionally insufficient for protected commerce writes.
2. **Google OAuth:** Google client ID/secret, authorized callback URL, and the staff allowlist/MFA policy.
3. **Environment:** production API/worker host, public API origin, stable egress IP, Supabase region/plan, and backup/PITR retention.
4. **Business policy:** Korea/KRW confirmation, shipping/returns/cancellation rules, stock reservation expiry, and whether card-backed easy-pay wallets are included.
5. **Operations:** email/SMS provider, alert destination, on-call owner, RTO/RPO and traffic targets.
6. **Compliance:** Korean privacy/consumer-law review and PCI scope/attestation.

Until these are supplied, the system stays fail-closed: the card payment button remains disabled, live payment remains off, and the production checklist keeps provider/deployment/legal evidence unchecked.
