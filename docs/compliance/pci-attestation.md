# PCI DSS Scope Determination (Pending)

## Summary
NOEUL uses Toss-hosted payment widget. Card data never enters NOEUL systems.

## Scope Reduction
- Toss widget handles card entry (iframe)
- NOEUL receives only paymentKey, orderId, amount from redirect
- No PAN, CVV, or raw card fields stored, logged, or proxied

## Merchant Obligations
- SAQ A-EP or SAQ A (depending on integration model)
- Annual ASV scan
- Network security controls for API origin

## Status
- [ ] Toss merchant contract verified
- [ ] Card-only widget configuration confirmed
- [ ] SAQ completed and submitted
- [ ] Annual ASV scan scheduled

## Action Required
Contact Toss merchant support for PCI documentation and sign the applicable SAQ before production launch.
