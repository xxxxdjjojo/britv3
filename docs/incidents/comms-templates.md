# Incident Communication Templates

Copy-paste templates for customer and status-page updates. **Rules:** never speculate about
root cause or a resolution time; never expose internal infrastructure detail, attack detail,
or another customer's data; keep it short and honest. Replace `[…]` placeholders.

---

## 1. Initial acknowledgement (status page + first email)

> **[Investigating] — [affected service]**
> We're aware of an issue affecting [service, e.g. sign-in]. We're investigating and will
> post an update by [next update time, e.g. within 30 minutes]. Thanks for your patience.

## 2. Investigating (no cause yet)

> **[Investigating] — [affected service]**
> We're still investigating the issue affecting [service]. [What customers may see, e.g.
> "Some sign-in attempts are failing."] We'll update again by [time].

## 3. Identified (cause understood, not yet fixed)

> **[Identified] — [affected service]**
> We've identified the cause of the issue affecting [service] and are working on a fix.
> [Optional: workaround, e.g. "Please retry in a few minutes."] Next update by [time].

## 4. Monitoring (fix applied, watching)

> **[Monitoring] — [affected service]**
> A fix has been applied and [service] is recovering. We're monitoring to confirm full
> recovery. Next update by [time].

## 5. Resolved

> **[Resolved] — [affected service]**
> The issue affecting [service] is resolved as of [time]. [Service] is operating normally.
> We're sorry for the disruption. If you still see a problem, contact us at [support link].

## 6. Customer-specific follow-up (individual impact)

> Hi [name],
> Between [start] and [end] you may have experienced [specific impact, e.g. "a payment that
> didn't complete"]. This has now been resolved. [What we did / what they should do, e.g.
> "No further action is needed — your subscription is active." OR "Please retry your
> payment."] Sorry for the trouble — reply here if anything still looks wrong.

## 7. Security / privacy escalation (holding statement)

> We're investigating a potential security issue and are treating it with the highest
> priority. We'll share verified information as soon as we have it. We won't speculate before
> we've confirmed the facts.

*Internal note: do not send detailed security comms without the Security/Privacy Lead and, if
personal data is involved, follow the compliance breach procedure — statutory notifications
(ICO / affected individuals) are governed there, not by this template.*

## 8. Payment issue

> **[affected billing service]**
> We're aware some [payments / renewals / payouts] between [start] and [end] were affected.
> No action is needed unless we contact you directly. Charges that didn't complete were not
> collected; any duplicate charges will be automatically reversed. We'll confirm once fully
> resolved.

## 9. Third-party provider outage

> **[Monitoring] — [affected service]**
> [Service] is degraded due to an issue with one of our providers ([category, e.g. "our email
> provider"] — not customer data). We're monitoring their recovery and will update by [time].

---

**Update cadence:** post a new update at every stated "next update" time even if there's no
news ("still investigating") — silence reads as neglect during an incident.
