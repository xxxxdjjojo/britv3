# Estate Agent Listing Distribution Research

Last verified: 2026-06-19.

## Summary

The safe integration order is CRM/feed ingestion first, portal distribution later. Rightmove, Zoopla, Jupix, Alto, Reapit, and Street all point to formal feed/API onboarding paths; none justify scraping portals or asking agents for portal passwords.

## Source Matrix

| Source | Verified integration facts | Product decision |
| --- | --- | --- |
| Rightmove ADF | Rightmove publishes ADF/RTDF specs for UK sales and lettings, requires ADF team test access, and expects `Send property`, `Remove property`, and `Get branch property list` calls to be tested. New members only go live once the branch is visible and a GO LIVE call has happened. Source: https://www.rightmove.co.uk/adf.html | Do not build live Rightmove distribution until credentials, test pack, branch visibility, and import ledger are ready. |
| Zoopla | Zoopla says listings can be added manually or via feed, feed uploads are handled by property software such as Alto/Jupix/Expert Agent, and Member Services provides the branch ID to the feed provider after written request. Source: https://support.zoopla.co.uk/hc/en-gb/articles/360007015338-How-do-I-set-up-a-feed | Treat Zoopla as branch-ID/provider onboarding, not self-service scraping. |
| Alto | Alto’s Client Feed Export API guide states its PDF provides technical information for uploading Alto properties. The article was updated 2025-10-08. Source: https://support.altosoftware.co.uk/hc/en-gb/articles/5048171901599-Client-Feed-Export-API-User-Guide | Keep Alto as a documented feed provider candidate, but require agency/API access before live work. |
| Reapit | Reapit Foundations documents REST APIs and notes customer-scoped access. Reapit Connect is the OAuth/OpenID identity layer. Sources: https://foundations-documentation.reapit.cloud/api/api-documentation and https://github.com/reapit/foundations-documentation/blob/master/api/reapit-connect.md | Reapit is the first live connector candidate after this MVP because official REST/OIDC docs and sandbox-oriented flows exist. |
| Street | Street publishes an Open API developer surface for its estate agency platform. Source: https://street.co.uk/developers/api | Keep as a later official-API candidate. |
| Jupix | Jupix XML spec says third-party web companies retrieve agent properties nightly from a unique URL; removed properties are absent from the feed; test XML is provided before a unique URL. Source: https://s3.amazonaws.com/helpscout.net/docs/assets/5600de649033603707857f12/attachments/577e18cb9033605a6aa4d748/JUPIX-Website-Listing-XML-Data-Specification.pdf | Implement tombstones/withdrawals and idempotency before any Jupix live feed. |
| National Trading Standards | NTS published full material information guidance for sales and lettings. Source: https://www.nationaltradingstandards.uk/news/full-material-information-guidance-published/ | Publish must be gated on material-information validation; imports may be reviewed before they become canonical listings. |

## MVP Boundary

- In scope: feed connection records, secret redaction, durable import ledger, deterministic Reapit-shaped fixture, review, approval, and canonical draft publish.
- Out of scope: live Rightmove/Zoopla/OnTheMarket distribution, portal scraping, portal password collection, and live CRM OAuth until agency credentials exist.
