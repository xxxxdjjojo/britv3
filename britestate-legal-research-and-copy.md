# Britestate V3 — Legal Pages: Research, Analysis & Full Copy

**Prepared:** 23 March 2026
**Purpose:** Proptech legal research to improve Britestate V3 legal pages by 100%
**Disclaimer:** This document is research guidance, not legal advice. Engage a qualified solicitor before going live.

---

## PART 1: REGULATORY LANDSCAPE

### 1.1 Primary Legislation Affecting Britestate

| Statute / Regulation | Relevance to Britestate | Key Obligation |
|---|---|---|
| **UK GDPR + Data Protection Act 2018** | Core. Britestate processes personal data of all 7 user roles. | Privacy policy, lawful basis for each processing activity, DPO appointment, DPIA for high-risk processing (AI property matching, profiling), data breach notification within 72 hours. |
| **Data (Use and Access) Act 2025 (DUAA)** | In force 5 Feb 2026. Updates UK GDPR and PECR. | New cookie consent exceptions for analytics/statistical cookies (opt-out rather than opt-in permitted if clear information provided). PECR penalties now up to £17.5m or 4% global turnover. |
| **Privacy and Electronic Communications Regulations 2003 (PECR)** | Cookies, direct marketing, electronic communications. | Pre-consent for non-essential cookies (subject to DUAA relaxation for analytics). Opt-in for marketing emails. Soft opt-in permitted for existing customer relationships. |
| **Consumer Rights Act 2015 (CRA)** | Britestate supplies digital content and services to consumers. | Digital content must be of satisfactory quality, fit for purpose, and as described (Part 1, Ch. 3). Services must be performed with reasonable care and skill (Part 1, Ch. 4). Unfair terms in consumer contracts are not binding (Part 2). |
| **Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 (CCRs)** | Subscription services (agent subscriptions, premium listings). | 14-day cooling-off period for distance contracts. Pre-contractual information requirements. Clear cancellation rights. |
| **Electronic Commerce (EC Directive) Regulations 2002** | Britestate is an information society service. | Must display: business name, geographic address, email, company registration number, VAT number. Acknowledge orders without undue delay. |
| **Estate Agents Act 1979** | Relevant if Britestate performs "estate agency work" (introducing buyers/sellers for a fee). As a platform intermediary, Britestate likely falls outside scope — but this must be monitored. | If caught: must declare personal interest, comply with duties of care, belong to a redress scheme. |
| **Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017)** | Relevant if Britestate facilitates property transactions or acts as an estate agent. From May 2025, letting agents also caught. | Risk assessment, CDD/EDD, SAR reporting to NCA, record retention (5 years), MLRO appointment, HMRC registration. |
| **Proceeds of Crime Act 2002 (POCA)** | Underpins AML obligations. | Offences of concealing, arranging, acquiring criminal property. Failure to report suspicion is a criminal offence. |
| **Renters' Rights Act 2025** | Royal Assent 27 Oct 2025. Abolishes Section 21 no-fault evictions (phased). Creates government Property Portal. | Britestate must reflect new tenancy structures. Landlord notice builders must track evolving ground-based possession rules. |
| **Online Safety Act 2023** | Britestate hosts user-generated content (listings, reviews, messages). | Duty of care to prevent illegal content. Must have clear reporting/complaints mechanism. Transparency reporting for larger platforms. |
| **Equality Act 2010 & Public Sector Equality Duty** | Accessibility obligations. Indirect application via web accessibility. | WCAG 2.1 AA compliance. Cannot discriminate in provision of services. Property listings must comply with equality law (e.g., no discriminatory letting criteria). |
| **Building Safety Act 2022** | Affects property listings for high-rise residential buildings. | Relevant safety information should be disclosed in listings where applicable. |
| **Fraud Act 2006** | Platform misuse, fraudulent listings. | Offences of fraud by false representation, failure to disclose, abuse of position. Britestate must have mechanisms to detect and remove fraudulent content. |
| **Computer Misuse Act 1990** | Scraping, hacking, unauthorised access. | Offences of unauthorised access, unauthorised modification of data. |
| **Telecommunications (Security) Act 2021 / Network & Information Systems Regulations 2018** | If Britestate becomes a "relevant digital service provider." | Security measures, incident reporting to ICO/NCSC. |

### 1.2 Key Regulatory Bodies

| Body | Jurisdiction |
|---|---|
| **Information Commissioner's Office (ICO)** | Data protection, PECR, cookies, direct marketing |
| **Competition and Markets Authority (CMA)** | Unfair commercial practices, fake reviews, misleading claims |
| **Advertising Standards Authority (ASA)** | Advertising claims, fee transparency |
| **HMRC** | AML supervision for estate/letting agents |
| **National Trading Standards Estate & Letting Agency Team (NTSELAT)** | Estate Agents Act enforcement |
| **The Property Ombudsman / Property Redress Scheme** | Complaints redress for estate agents |
| **Ofcom** | Online Safety Act enforcement |

### 1.3 Relevant Case Law & Enforcement Actions

**Purplebricks / ASA (2017–2018):** The ASA ruled Purplebricks' advertising was misleading because it did not make clear that fees were payable regardless of whether the property sold. Lesson for Britestate: all fee structures (Stripe Connect 2.5% commission, agent subscriptions, premium listings) must be transparent and unconditional fees clearly flagged.

**CMA v Fake Reviews (2020–2025):** The CMA has taken enforcement action against platforms hosting fake reviews, including issuing formal warnings to social media platforms. The Digital Markets, Competition and Consumers Act 2024 gives the CMA enhanced powers. Lesson: Britestate must have robust review verification and clear policies against fake reviews.

**Lloyd v Google LLC [2021] UKSC 50:** The Supreme Court held that loss of control of personal data can itself constitute damage for the purposes of compensation claims. Lesson: data breaches affecting property search history, financial data, or location data could expose Britestate to class-action-style representative proceedings.

**Vidal-Hall v Google Inc [2015] EWCA Civ 311:** Confirmed that distress alone (without financial loss) can found a claim under data protection legislation. Lesson: reinforces need for robust data protection and clear privacy disclosures.

**HMRC AML Enforcement (2025–26):** 170 penalties totalling £835,000+ issued to estate agency businesses for AML non-compliance. Lesson: AML compliance is actively enforced; Britestate's policy must be operational, not decorative.

**ICO Enforcement — Property Sector:** ICO has fined property-related businesses for unsolicited marketing communications and data breaches. Cookie consent enforcement has intensified post-DUAA with higher penalties now available.

---

## PART 2: GAP ANALYSIS — CURRENT vs. REQUIRED

| Page | Current State | Key Gaps |
|---|---|---|
| **Terms of Service** | 8 skeleton sections, all marked TODO | Missing: role-specific terms (7 user roles), Stripe Connect payment terms, subscription/cooling-off provisions, dispute resolution (ADR), AI features disclosure, platform commission terms, user content licence, indemnification, force majeure, entire agreement clause, severability. |
| **Privacy Policy** | 11 sections, placeholder content | Missing: comprehensive data inventory by role, DPIA disclosure for AI/profiling, sub-processor table with transfer mechanisms, automated decision-making disclosure (Art. 22), children's data provisions, specific retention periods by data type, complaint right to ICO, DPO vs. privacy contact distinction, DUAA updates. |
| **Cookie Policy** | 5 sections, 6 cookies listed | Missing: DUAA-compliant analytics cookie treatment, local storage/pixel tracking disclosure, third-party cookie detail (MapTiler, Sentry), consent mechanism explanation referencing PECR, browser-by-browser management instructions. |
| **Acceptable Use** | 6 sections, basic list | Missing: property-specific prohibitions (phantom listings, gazumping facilitation), discrimination provisions (Equality Act), AI-generated content rules, review authenticity requirements, consequences matrix, intellectual property infringement procedure. |
| **GDPR Rights** | Form exists | Missing: right to human review of automated decisions, right to lodge complaint with ICO, identity verification process description, timeframe commitments (30 days), fee information. |
| **Data Processing Agreement** | Exists | Needs expansion for Stripe Connect sub-processors, AI processing (Anthropic), map data (MapTiler). |
| **AML Policy** | 8 sections, basic | Missing: platform-specific risk indicators, technology-assisted CDD description, PEP screening detail, sanctions screening (OFSI), letting agent obligations (post-May 2025), training frequency commitment, board-level accountability. |
| **Modern Slavery** | Exists | Needs supply chain specifics, due diligence description, KPIs. |
| **Accessibility** | Exists | Needs WCAG 2.1 AA conformance specifics, known issues, testing methodology, remediation timeline. |
| **Complaints** | Exists | Needs ADR disclosure, ombudsman information, response timeframes, escalation matrix. |
| **Disclaimer** | 6 sections, basic | Missing: AI-generated content disclaimers, valuation/market data limitations, EPC data source attribution, map data accuracy. |
| **NEW: Fee Transparency** | Does not exist | Required by CMA guidance and estate agent regulations. Must clearly display Stripe Connect commission, subscription tiers, additional charges. |
| **NEW: AI Transparency** | Does not exist | Best practice given Britestate uses Claude AI for property matching, embeddings, and recommendations. |

---

## PART 3: FULL LEGAL COPY

> The following is production-ready copy for each legal page. Replace placeholder values in [SQUARE BRACKETS] with actual details before publishing.

---

### 3.1 TERMS OF SERVICE

**Last updated: [DATE]**

#### 1. About These Terms

1.1. These Terms of Service ("Terms") govern your access to and use of the Britestate platform at britestate.co.uk and any associated mobile applications (together, the "Platform"), operated by Britestate Ltd ("Britestate", "we", "us", "our"), a company registered in England and Wales under company number [COMPANY NUMBER], with its registered office at [REGISTERED ADDRESS].

1.2. By accessing or using the Platform, you agree to be bound by these Terms, our Privacy Policy, Cookie Policy, and Acceptable Use Policy (together, the "Legal Documents"). If you do not agree, you must not use the Platform.

1.3. If you are using the Platform on behalf of a business or other entity, you represent that you have the authority to bind that entity to these Terms.

1.4. We are regulated by HMRC for the purposes of the Money Laundering Regulations 2017. Our HMRC supervision reference is [REFERENCE].

#### 2. The Platform

2.1. Britestate is a property technology platform that connects homebuyers, renters, sellers, landlords, estate agents, and service providers (each a "User" or "you"). We act as an intermediary — we do not buy, sell, let, or manage property directly.

2.2. We are not an estate agent as defined by the Estate Agents Act 1979. We do not introduce parties to property transactions for a fee. Where individual estate agents use the Platform, they are responsible for their own regulatory compliance.

2.3. We provide certain AI-powered features including property recommendations, valuation estimates, and search matching. These are informational tools and do not constitute professional advice. See Section 14 for further detail.

#### 3. User Accounts

3.1. To access certain features, you must create an account. You must provide accurate, current, and complete information and keep it updated.

3.2. You are responsible for maintaining the security of your account credentials. You must notify us immediately at support@britestate.co.uk if you suspect unauthorised access.

3.3. We may require identity verification for certain account types (estate agents, landlords, service providers) in accordance with our regulatory obligations.

3.4. You may only hold one account per role unless we agree otherwise in writing.

#### 4. User Roles and Specific Terms

4.1. **Homebuyers and Renters.** You may search listings, save properties, set alerts, contact agents and landlords, and access AI-powered recommendations. You must not contact property owners for purposes unrelated to genuine property enquiries.

4.2. **Sellers.** You may list properties for sale either directly or through an estate agent. All listing information must be accurate, complete, and not misleading. You must hold legal title (or have authority from the titleholder) to any property you list.

4.3. **Landlords.** You are responsible for ensuring your rental listings comply with the Renters' Rights Act 2025, the Housing Act 2004, and all applicable licensing requirements. You must hold a valid Energy Performance Certificate (EPC), gas safety certificate, and electrical safety certificate for each listed property. You acknowledge that from [COMMENCEMENT DATE], the government Property Portal will require separate registration.

4.4. **Estate Agents.** You represent and warrant that you are a member of a government-approved redress scheme (The Property Ombudsman or the Property Redress Scheme), that you hold appropriate professional indemnity insurance, and that you are registered with HMRC for AML supervision. You must display your fees transparently on your Britestate profile in accordance with CMA guidance.

4.5. **Service Providers.** You represent that you hold all licences, certifications, and insurance necessary to perform the services you offer. Where applicable, this includes Gas Safe registration, NICEIC or NAPIT accreditation, or appropriate trade body membership.

#### 5. Fees and Payments

5.1. **Platform Commission.** Where transactions are facilitated through the Platform, a commission of 2.5% of the transaction value may apply. This is processed via Stripe Connect. The commission is payable by [SPECIFY: agent/service provider/other] and is clearly displayed before any transaction is confirmed.

5.2. **Subscription Fees.** Certain user roles (estate agents, service providers) may subscribe to paid plans. Fees are set out on our pricing page and are payable monthly or annually in advance. All fees are exclusive of VAT unless stated otherwise.

5.3. **Cooling-Off Period.** If you are a consumer subscribing to a paid plan, you have a 14-day right to cancel under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013. To cancel, email support@britestate.co.uk within 14 days of subscribing. If you have used the service during the cooling-off period, you may be charged a proportionate amount.

5.4. **Refunds.** Outside the cooling-off period, subscription fees are non-refundable except where required by law. Commission charges are non-refundable once the underlying transaction has completed.

5.5. **Payment Processing.** All payments are processed by Stripe. We do not store your full card details. Stripe's terms of service apply to payment processing.

#### 6. Content and Intellectual Property

6.1. **Our Content.** All content on the Platform (including the software, design, logos, text, and database structure) is owned by or licensed to Britestate Ltd and is protected by copyright, database rights, trade marks, and other intellectual property laws. You may not copy, reproduce, or redistribute our content without our prior written consent.

6.2. **Your Content.** By uploading content (listings, photos, reviews, messages) to the Platform, you grant Britestate a non-exclusive, worldwide, royalty-free licence to use, display, reproduce, and distribute that content for the purpose of operating and promoting the Platform. You retain ownership of your content.

6.3. **Listing Photos.** Property photographs must accurately represent the property at the time of listing. You must own or have a licence to use all photographs you upload. We reserve the right to remove photos that are misleading, digitally manipulated to misrepresent the property, or that infringe third-party rights.

6.4. **Reviews.** All reviews must be genuine, based on actual experience, and comply with our Acceptable Use Policy. We reserve the right to remove reviews that we reasonably believe are fake, incentivised, or defamatory.

#### 7. Prohibited Uses

7.1. You must not use the Platform in breach of our Acceptable Use Policy. In particular, you must not post fraudulent, misleading, or phantom listings; scrape or data-mine the Platform; use the Platform to facilitate money laundering or fraud; discriminate against any person on grounds protected by the Equality Act 2010; or interfere with the Platform's security or functionality.

#### 8. Disclaimers

8.1. The Platform is provided "as is" and "as available." We do not guarantee that the Platform will be uninterrupted, error-free, or free from viruses.

8.2. Property listings, valuations, market data, AI-generated recommendations, and EPC data are provided for informational purposes only. We do not verify the accuracy of third-party content and do not provide legal, financial, surveying, or mortgage advice. See our Disclaimer for full details.

8.3. We are not responsible for the conduct of any User, the accuracy of any listing, or the outcome of any transaction facilitated through the Platform.

#### 9. Limitation of Liability

9.1. Nothing in these Terms excludes or limits our liability for: (a) death or personal injury caused by our negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that cannot be excluded by law.

9.2. Subject to Section 9.1, our aggregate liability to you for any claims arising out of or in connection with these Terms or your use of the Platform shall not exceed the greater of (a) the fees you have paid to us in the 12 months preceding the claim, or (b) £100.

9.3. Subject to Section 9.1, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or opportunity.

9.4. If you are a consumer, your statutory rights under the Consumer Rights Act 2015 are unaffected.

#### 10. Indemnification

10.1. If you are an estate agent, landlord, or service provider, you agree to indemnify Britestate against any claims, losses, damages, or expenses (including legal fees) arising from: (a) your breach of these Terms; (b) your breach of any applicable law or regulation; (c) any claim by a third party arising from your use of the Platform or your content.

#### 11. Suspension and Termination

11.1. We may suspend or terminate your account at any time if we reasonably believe you have breached these Terms, our Acceptable Use Policy, or any applicable law. Where practicable, we will give you notice and an opportunity to remedy the breach.

11.2. You may close your account at any time through your account settings or by emailing support@britestate.co.uk. Account deletion is subject to a 30-day grace period during which you may reverse the decision.

11.3. On termination, your licence to use the Platform ceases. Provisions that by their nature should survive termination (including Sections 6, 9, 10, and 15) will survive.

#### 12. Dispute Resolution

12.1. We aim to resolve disputes informally. Please contact support@britestate.co.uk in the first instance.

12.2. If we cannot resolve a dispute informally, you may refer the matter to an alternative dispute resolution (ADR) provider. For consumers, you may use the EU/UK Online Dispute Resolution platform at https://ec.europa.eu/consumers/odr (note: availability may be limited post-Brexit; check current status).

12.3. Nothing in this Section prevents either party from seeking interim injunctive relief from a court of competent jurisdiction.

#### 13. Force Majeure

13.1. We shall not be liable for any failure or delay in performing our obligations where such failure or delay results from events beyond our reasonable control, including natural disasters, pandemics, government action, power failure, internet disruption, or cyberattack.

#### 14. AI Features and Automated Decision-Making

14.1. Britestate uses artificial intelligence (powered by Anthropic Claude and vector embeddings) to provide property recommendations, estimated valuations, and search matching. These outputs are generated algorithmically and should not be relied upon as professional advice.

14.2. Where AI features involve automated decision-making that significantly affects you, you have the right to request human review under Article 22 of UK GDPR. Contact privacy@britestate.co.uk to exercise this right.

14.3. We are transparent about which features use AI. AI-generated content and recommendations are labelled as such on the Platform.

#### 15. Governing Law and Jurisdiction

15.1. These Terms are governed by the laws of England and Wales.

15.2. The courts of England and Wales shall have exclusive jurisdiction, except that if you are a consumer habitually resident in Scotland or Northern Ireland, you may also bring proceedings in those jurisdictions.

#### 16. Changes to These Terms

16.1. We may update these Terms from time to time. We will notify you of material changes by email or in-app notification at least 30 days before they take effect.

16.2. If you do not agree to the updated Terms, you may close your account before the changes take effect. Continued use after the effective date constitutes acceptance.

#### 17. General

17.1. **Entire Agreement.** These Terms (together with the other Legal Documents) constitute the entire agreement between you and Britestate in relation to your use of the Platform.

17.2. **Severability.** If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

17.3. **Waiver.** No failure or delay by Britestate in exercising any right shall constitute a waiver of that right.

17.4. **Assignment.** You may not assign your rights under these Terms. We may assign our rights to any affiliate or successor.

17.5. **Third-Party Rights.** These Terms do not confer any rights on any third party under the Contracts (Rights of Third Parties) Act 1999.

#### 18. Contact Us

Britestate Ltd
[REGISTERED ADDRESS]
Company No. [COMPANY NUMBER]
Email: support@britestate.co.uk
HMRC AML Registration: [REFERENCE]

---

### 3.2 PRIVACY POLICY

**Last updated: [DATE]**

#### 1. Introduction

1.1. Britestate Ltd ("Britestate", "we", "us") is the data controller for the personal data processed through the britestate.co.uk platform (the "Platform"). We are registered with the Information Commissioner's Office (ICO) under registration number [ICO REGISTRATION NUMBER].

1.2. This Privacy Policy explains how we collect, use, share, and protect your personal data in compliance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the Data (Use and Access) Act 2025.

1.3. Our Data Protection Officer can be contacted at privacy@britestate.co.uk or by post at [REGISTERED ADDRESS].

#### 2. Data We Collect

We collect the following categories of personal data:

**2.1. Account Data:** Name, email address, phone number, password (hashed), profile photo, user role (homebuyer, renter, seller, landlord, estate agent, service provider).

**2.2. Identity Verification Data** (agents, landlords, service providers): Government-issued ID, proof of address, professional qualifications, company registration details, redress scheme membership.

**2.3. Property Data:** Listing details, property photos, EPC data, floor plans, property documents uploaded by you.

**2.4. Transaction Data:** Payment amounts, commission records, subscription history, invoices. Card details are processed by Stripe and not stored by us.

**2.5. Search and Browsing Data:** Property search queries, saved searches, saved properties, viewing history, alert preferences.

**2.6. Communication Data:** Messages sent through the Platform, enquiry forms, support tickets.

**2.7. Technical Data:** IP address, browser type and version, device type, operating system, referring URL, pages visited, session duration.

**2.8. AI Interaction Data:** Property recommendations viewed, feedback on recommendations, search preference signals used by our AI matching system.

**2.9. AML/KYC Data:** Where required by the Money Laundering Regulations 2017: source of funds declarations, PEP screening results, sanctions screening results.

#### 3. Legal Basis for Processing

| Processing Activity | Lawful Basis (UK GDPR Art. 6) | Detail |
|---|---|---|
| Account creation and management | Contract (Art. 6(1)(b)) | Necessary to provide the service you signed up for |
| Property search, listings, and alerts | Contract (Art. 6(1)(b)) | Core platform functionality |
| Payment processing via Stripe | Contract (Art. 6(1)(b)) | Necessary to process transactions |
| Identity verification (agents, landlords) | Legal obligation (Art. 6(1)(c)) | Required by MLR 2017 and Estate Agents Act 1979 |
| AML/KYC checks | Legal obligation (Art. 6(1)(c)) | Required by MLR 2017 and POCA 2002 |
| AI-powered property recommendations | Legitimate interests (Art. 6(1)(f)) | To personalise your experience (balanced against your right to opt out) |
| Platform analytics and improvement | Legitimate interests (Art. 6(1)(f)) | To improve platform performance and user experience |
| Marketing emails (opted in) | Consent (Art. 6(1)(a)) | Only with your explicit opt-in; withdraw at any time |
| Marketing to existing customers (soft opt-in) | Legitimate interests (Art. 6(1)(f)) | PECR soft opt-in for similar services; opt-out in every email |
| Fraud prevention and platform security | Legitimate interests (Art. 6(1)(f)) | To protect users and maintain platform integrity |
| Responding to legal requests | Legal obligation (Art. 6(1)(c)) | Where required by court order or statutory obligation |
| Tax record retention | Legal obligation (Art. 6(1)(c)) | HMRC requirements |

**Special Category Data:** We do not intentionally collect special category data (e.g., racial origin, health data). If you voluntarily include such data in communications, we process it on the basis of your explicit consent (Art. 9(2)(a)).

#### 4. How We Use Your Data

4.1. To operate and maintain the Platform, including account management, listing display, search functionality, and communication features.

4.2. To personalise your experience through AI-powered property recommendations and search matching. You can opt out of personalisation in your privacy settings.

4.3. To process payments and commissions through Stripe Connect.

4.4. To verify identities and comply with anti-money laundering regulations.

4.5. To send transactional communications (booking confirmations, account updates, security alerts).

4.6. To send marketing communications where you have opted in or where soft opt-in applies.

4.7. To detect and prevent fraud, spam, and abuse.

4.8. To analyse platform usage and improve our services.

4.9. To comply with legal and regulatory obligations.

#### 5. Data Sharing

We share your data with the following categories of recipients:

| Recipient | Purpose | Location | Transfer Mechanism |
|---|---|---|---|
| **Supabase (database hosting)** | Platform infrastructure | EU (Frankfurt) | UK adequacy decision |
| **Stripe** | Payment processing | USA | UK-approved SCCs |
| **Anthropic** | AI features (property matching, recommendations) | USA | UK-approved SCCs + DPA |
| **Resend** | Transactional and marketing email | USA | UK-approved SCCs |
| **PostHog** | Product analytics | EU | UK adequacy decision |
| **Sentry** | Error tracking and monitoring | USA | UK-approved SCCs |
| **MapTiler** | Map display and geocoding | EU | UK adequacy decision |
| **Upstash** | Rate limiting (Redis) | EU | UK adequacy decision |
| **Vercel** | Hosting and CDN | Global (edge) | UK-approved SCCs |

We do not sell your personal data to third parties. We may share data with law enforcement or regulators where required by law.

When you contact an estate agent, landlord, or service provider through the Platform, your contact details are shared with that User to facilitate the enquiry. This is necessary for the performance of our contract with you.

#### 6. Data Retention

| Data Type | Retention Period | Basis |
|---|---|---|
| Active account data | Duration of account + 30-day deletion grace period | Contract performance |
| Closed account (basic record) | 6 years from closure | Limitation Act 1980 (6-year limitation period) |
| Transaction and payment records | 7 years from transaction | HMRC tax record requirements |
| AML/KYC records | 5 years from end of business relationship | MLR 2017, Reg. 40 |
| Communication records | 2 years from last message | Legitimate interest (dispute resolution) |
| Analytics data | 26 months (aggregated) | Legitimate interest |
| Marketing consent records | Duration of consent + 2 years | PECR compliance evidence |
| SAR/GDPR request records | 3 years | ICO accountability principle |

#### 7. International Transfers

7.1. Some of our sub-processors operate outside the United Kingdom. Where data is transferred outside the UK, we ensure appropriate safeguards are in place.

7.2. For transfers to countries with a UK adequacy decision (including the EU/EEA), no additional safeguards are required.

7.3. For transfers to other countries (including the USA), we rely on UK International Data Transfer Agreements (IDTAs) or UK-approved Standard Contractual Clauses (SCCs), supplemented by a transfer impact assessment where appropriate.

7.4. You may request a copy of the relevant transfer safeguards by contacting privacy@britestate.co.uk.

#### 8. Automated Decision-Making and Profiling

8.1. Our AI-powered property recommendation system uses your search history, saved properties, and stated preferences to generate personalised property suggestions. This constitutes profiling under UK GDPR.

8.2. No decisions with legal or similarly significant effects are made solely by automated means without human oversight.

8.3. You have the right to: (a) opt out of profiling for recommendation purposes in your privacy settings; (b) request human review of any AI-generated output that significantly affects you; (c) receive meaningful information about the logic involved in our AI systems.

#### 9. Your Rights

Under UK GDPR, you have the following rights:

**9.1. Right of Access (Art. 15):** You may request a copy of all personal data we hold about you.

**9.2. Right to Rectification (Art. 16):** You may request correction of inaccurate or incomplete data.

**9.3. Right to Erasure (Art. 17):** You may request deletion of your data, subject to our legal retention obligations.

**9.4. Right to Restrict Processing (Art. 18):** You may request restriction of processing while a dispute is resolved.

**9.5. Right to Data Portability (Art. 20):** You may request your data in a structured, machine-readable format (JSON).

**9.6. Right to Object (Art. 21):** You may object to processing based on legitimate interests, including profiling for AI recommendations. We will cease processing unless we have compelling legitimate grounds.

**9.7. Rights Related to Automated Decision-Making (Art. 22):** You may request human intervention in any solely automated decision that significantly affects you.

**9.8. Right to Withdraw Consent:** Where processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.

To exercise any right, use our GDPR Rights page at britestate.co.uk/legal/gdpr-rights, or email privacy@britestate.co.uk. We will respond within 30 days. We may request identity verification before processing your request. If we cannot action your request, we will explain why.

**9.9. Right to Complain:** You have the right to lodge a complaint with the ICO at ico.org.uk or by calling 0303 123 1113.

#### 10. Cookies

We use cookies and similar technologies. Please see our Cookie Policy at britestate.co.uk/legal/cookies for full details, including how to manage your preferences.

#### 11. Children's Data

The Platform is not directed at children under 18. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child under 18, we will delete it promptly.

#### 12. Data Security

12.1. We implement appropriate technical and organisational measures to protect your data, including encryption in transit (TLS 1.3) and at rest (AES-256), role-based access controls, regular security testing, and incident response procedures.

12.2. In the event of a personal data breach that is likely to result in a risk to your rights, we will notify the ICO within 72 hours and notify affected individuals without undue delay where there is a high risk.

#### 13. Changes to This Policy

We will notify you of material changes to this policy by email or in-app notification at least 30 days before they take effect. The "last updated" date at the top of this page indicates the most recent revision.

#### 14. Contact

Data Protection Officer: privacy@britestate.co.uk
Britestate Ltd, [REGISTERED ADDRESS]
Company No. [COMPANY NUMBER]
ICO Registration: [ICO REGISTRATION NUMBER]

---

### 3.3 COOKIE POLICY

**Last updated: [DATE]**

#### 1. What Are Cookies

1.1. Cookies are small text files placed on your device when you visit a website. They serve various purposes including remembering your preferences, enabling core functionality, and helping us understand how you use the Platform.

1.2. We also use similar technologies including local storage, pixel tags, and web beacons, which are covered by this policy.

1.3. This policy complies with the Privacy and Electronic Communications Regulations 2003 (PECR) as amended by the Data (Use and Access) Act 2025.

#### 2. Categories of Cookies

**2.1. Strictly Necessary Cookies.** These are essential for the Platform to function. They enable core features like authentication, security, and cookie consent management. They cannot be disabled.

**2.2. Functional Cookies.** These remember your preferences (such as search filters, dark mode setting, and language preferences) to provide a more personalised experience. Under the DUAA 2025, these may be set without opt-in consent provided we give you clear information and an opt-out mechanism.

**2.3. Analytics Cookies.** These help us understand how users interact with the Platform, which pages are most visited, and where errors occur. Under the DUAA 2025, analytics cookies used purely for statistical purposes may be set on an opt-out basis, provided we clearly inform you and offer an easy opt-out. We use PostHog for product analytics.

**2.4. Marketing Cookies.** These track your activity across websites to deliver personalised advertising. We only set marketing cookies with your explicit opt-in consent. We use Facebook Pixel for conversion tracking where you have consented.

#### 3. Cookie Table

| Cookie Name | Provider | Purpose | Duration | Category |
|---|---|---|---|---|
| sb-*-auth-token | Supabase | Authentication session | Session / 1 year | Strictly Necessary |
| brite_cookie_consent | Britestate | Stores your cookie consent choices | 1 year | Strictly Necessary |
| __stripe_mid | Stripe | Payment fraud prevention | 1 year | Strictly Necessary |
| __stripe_sid | Stripe | Payment session | 30 minutes | Strictly Necessary |
| brite_theme | Britestate | Dark/light mode preference | 1 year | Functional |
| brite_search_prefs | Britestate | Saved search filter defaults | 1 year | Functional |
| ph_* | PostHog | Product analytics and feature usage | 1 year | Analytics |
| _ga, _ga_* | Google | Aggregate usage statistics | 2 years | Analytics |
| _fbp | Facebook | Conversion tracking (with consent) | 3 months | Marketing |
| maptiler_session | MapTiler | Map tile caching | Session | Functional |
| sentry-* | Sentry | Error tracking | Session | Functional |

#### 4. How to Manage Your Preferences

4.1. **On Britestate:** Click "Manage Cookie Preferences" in the footer or use the button below to open your cookie settings. You can toggle Analytics and Marketing cookies on or off at any time.

4.2. **In Your Browser:** You can also manage cookies through your browser settings:

- **Chrome:** Settings > Privacy and security > Cookies and other site data
- **Firefox:** Settings > Privacy & Security > Cookies and Site Data
- **Safari:** Preferences > Privacy > Manage Website Data
- **Edge:** Settings > Cookies and site permissions > Manage and delete cookies

4.3. Please note that blocking Strictly Necessary cookies will prevent the Platform from functioning properly. Blocking Functional cookies may degrade your experience.

4.4. For more information about cookies generally, visit allaboutcookies.org.

#### 5. Updates

We update this Cookie Policy when we add or remove cookies. Material changes will be communicated via our cookie consent banner.

---

### 3.4 ACCEPTABLE USE POLICY

**Last updated: [DATE]**

#### 1. Introduction

1.1. This Acceptable Use Policy ("AUP") supplements the Terms of Service and applies to all Users of the Britestate platform. It sets out the standards of conduct we expect and the behaviours we prohibit.

1.2. This policy is informed by the Fraud Act 2006, the Computer Misuse Act 1990, the Online Safety Act 2023, the Equality Act 2010, and the Consumer Protection from Unfair Trading Regulations 2008.

#### 2. Permitted Uses

2.1. You may use Britestate to: search for and view property listings; list properties for sale or rent (where you have lawful authority); contact and communicate with other Users in connection with genuine property enquiries; engage estate agents and service providers; leave honest reviews based on genuine experience; and access AI-powered property tools and recommendations.

#### 3. Prohibited Conduct

You must not:

**3.1. Fraudulent and Misleading Activity**
- Post fraudulent, fictitious, or phantom listings (listings for properties you do not have authority to market);
- Provide false or misleading information about a property's condition, price, tenure, or availability;
- Manipulate photos, floor plans, or virtual tours to misrepresent a property (including undisclosed AI-generated imagery);
- Engage in gazumping facilitation, gazundering, or other practices intended to unfairly manipulate transactions;
- Post fake, incentivised, or misleading reviews or ratings.

**3.2. Discrimination**
- Refuse to sell, let, or provide services to any person on grounds of race, sex, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, religion or belief, sexual orientation, or age, contrary to the Equality Act 2010;
- Include discriminatory criteria in property listings (e.g., "no DSS", "professionals only" where used as a proxy for discrimination).

**3.3. Money Laundering and Financial Crime**
- Use the Platform to facilitate money laundering, terrorist financing, sanctions evasion, or tax evasion (Proceeds of Crime Act 2002, Terrorism Act 2000, Criminal Finances Act 2017);
- Provide false identity documents or source-of-funds information.

**3.4. Technical Abuse**
- Scrape, crawl, spider, or data-mine the Platform without our prior written consent;
- Attempt to gain unauthorised access to any part of the Platform, other Users' accounts, or our systems (Computer Misuse Act 1990);
- Transmit viruses, malware, or any code designed to disrupt or damage the Platform;
- Use automated tools (bots) to interact with the Platform without authorisation;
- Circumvent rate limits, access controls, or security features.

**3.5. Harassment and Harmful Content**
- Harass, threaten, bully, or intimidate other Users;
- Post defamatory, obscene, or illegal content;
- Send spam or unsolicited commercial communications;
- Post content that constitutes a priority offence under the Online Safety Act 2023.

**3.6. Intellectual Property**
- Upload content that infringes the copyright, trade mark, or other intellectual property rights of any third party;
- Copy or redistribute listings, photos, or content from the Platform without permission.

#### 4. Content Standards

4.1. **Listing Accuracy.** All listings must truthfully represent the property. Photos must be of the actual property and taken within the past 12 months (or clearly marked as historical). Material facts must be disclosed. Floor plans must be to a reasonable scale with a disclaimer that they are for illustrative purposes.

4.2. **Review Authenticity.** Reviews must reflect genuine personal experience. You must disclose any material connection to the subject of your review (e.g., if you are a family member of the agent). Businesses must not offer incentives for positive reviews.

4.3. **AI-Generated Content.** If you use AI tools to generate listing descriptions or other content, you must review the output for accuracy before publishing. Britestate is not responsible for inaccuracies in AI-generated content you publish.

#### 5. Enforcement

5.1. We monitor the Platform for breaches of this AUP using a combination of automated tools, user reports, and manual review.

5.2. **Consequences.** Depending on the severity and nature of the breach:
- First offence (minor): Warning and content removal;
- Repeated or moderate offence: Temporary account suspension (7–30 days);
- Serious offence (fraud, discrimination, criminal activity): Immediate permanent account termination and referral to law enforcement or relevant regulator.

5.3. We reserve the right to remove any content and suspend or terminate any account at any time where we reasonably believe a breach has occurred, without prior notice where urgency requires.

#### 6. Reporting Violations

6.1. If you believe a User has breached this AUP, please report it using the "Report" button on the relevant listing, review, or profile, or email compliance@britestate.co.uk.

6.2. We investigate all reports and aim to respond within 5 working days. We will not disclose your identity to the reported User without your consent (except where required by law).

#### 7. Appeals

7.1. If your account is suspended or content is removed, you may appeal within 14 days by emailing compliance@britestate.co.uk with the subject line "AUP Appeal — [Your Account Email]."

7.2. Appeals are reviewed by a senior team member who was not involved in the original decision. We aim to resolve appeals within 10 working days.

---

### 3.5 GDPR DATA SUBJECT RIGHTS

**Last updated: [DATE]**

#### 1. Your Rights

Under the UK General Data Protection Regulation, you have the following rights in relation to your personal data held by Britestate Ltd:

**Right of Access (Art. 15):** Request a copy of all personal data we hold about you, together with information about how we process it.

**Right to Rectification (Art. 16):** Request correction of any inaccurate or incomplete personal data.

**Right to Erasure (Art. 17):** Request deletion of your personal data, subject to our legal obligations (e.g., AML record retention, tax records).

**Right to Restrict Processing (Art. 18):** Request that we temporarily stop processing your data while a dispute about accuracy or our grounds for processing is resolved.

**Right to Data Portability (Art. 20):** Request a copy of your personal data in a structured, commonly used, machine-readable format (JSON). This applies to data you have provided to us that we process by automated means on the basis of consent or contract.

**Right to Object (Art. 21):** Object to processing based on legitimate interests, including profiling for AI-powered property recommendations. We will stop processing unless we have compelling legitimate grounds that override your interests.

**Rights Related to Automated Decision-Making (Art. 22):** Request human review of any decision made solely by automated means that has a significant effect on you. Request meaningful information about the logic involved.

**Right to Withdraw Consent:** Where we process your data based on consent (e.g., marketing emails), you may withdraw consent at any time.

#### 2. How to Make a Request

Use the form below, or email privacy@britestate.co.uk, or write to: Data Protection Officer, Britestate Ltd, [REGISTERED ADDRESS].

Please specify which right you wish to exercise and provide sufficient information for us to verify your identity and locate your data.

#### 3. Identity Verification

To protect your data, we must verify your identity before processing your request. We may ask you to confirm your email address, provide a copy of photo ID, or answer security questions linked to your account.

#### 4. Response Timeframe

We will respond to your request within 30 calendar days of receiving it (and verifying your identity). If your request is complex or we receive a high volume of requests, we may extend this by a further 60 days, in which case we will notify you within the first 30 days.

#### 5. Fees

Requests are free of charge. However, we may charge a reasonable fee for manifestly unfounded or excessive requests, or where you request additional copies of your data.

#### 6. Exemptions

We may be unable to fully comply with your request where an exemption applies, including: ongoing legal proceedings, regulatory obligations (e.g., AML record retention), or the rights and freedoms of others. We will explain any exemption that applies.

#### 7. Complaints

If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office:

ICO, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF
Tel: 0303 123 1113
Web: ico.org.uk

---

### 3.6 DATA PROCESSING AGREEMENT (Summary)

**Last updated: [DATE]**

This is a summary of the Data Processing Agreement ("DPA") that applies when Britestate processes personal data on behalf of Users who are data controllers (primarily estate agents and service providers).

**Scope:** This DPA applies where an estate agent or service provider uploads client data to the Platform and Britestate processes it on their instructions.

**Britestate's Role:** Data Processor (under Art. 28 UK GDPR).

**Controller's Obligations:** The controller must have a lawful basis for the personal data it uploads, must have provided appropriate privacy notices to data subjects, and must not instruct Britestate to process data in a manner that would breach UK GDPR.

**Britestate's Obligations:** Process data only on documented instructions from the controller. Implement appropriate technical and organisational security measures. Notify the controller of any data breach without undue delay. Assist the controller in fulfilling data subject requests. Delete or return all personal data on termination. Make available information necessary to demonstrate compliance.

**Sub-Processors:** Britestate uses the sub-processors listed in our Privacy Policy (Section 5). We will notify controllers at least 30 days before adding a new sub-processor. Controllers may object, and if the objection cannot be resolved, may terminate the DPA.

**International Transfers:** As described in our Privacy Policy (Section 7).

**Audit Rights:** Controllers may audit Britestate's compliance with this DPA with reasonable notice and during business hours, subject to confidentiality obligations.

The full DPA is available on request from privacy@britestate.co.uk.

---

### 3.7 ANTI-MONEY LAUNDERING POLICY

**Last updated: [DATE]**

#### 1. Policy Statement

1.1. Britestate Ltd is committed to preventing the use of its platform for money laundering and terrorist financing. This policy sets out our obligations under the Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 ("MLR 2017"), the Proceeds of Crime Act 2002 ("POCA"), the Terrorism Act 2000, and the Sanctions and Anti-Money Laundering Act 2018.

1.2. This policy applies to all Britestate staff, directors, contractors, and any Users facilitating property transactions through the Platform.

1.3. Britestate is registered with HMRC for AML supervision. Our registration reference is [HMRC REFERENCE].

#### 2. Risk Assessment

2.1. We maintain a firm-wide risk assessment that identifies and assesses the money laundering and terrorist financing risks to which we are subject. This assessment considers: the types of property transactions facilitated; the geographic locations of our Users; the profile of our customer base; and the delivery channels through which we operate (digital platform).

2.2. Key risk factors for our platform include: high-value property transactions, cash-rich customers, overseas buyers, properties purchased through companies or trusts, and transactions where the stated source of funds is inconsistent with the customer's profile.

2.3. Our risk assessment is reviewed at least annually and updated when there are material changes to our business or the threat landscape.

#### 3. Customer Due Diligence (CDD)

3.1. We apply CDD to all Users conducting or facilitating property transactions through the Platform where required by MLR 2017.

3.2. CDD measures include: verification of identity (full legal name, date of birth, residential address) using reliable and independent sources; verification of the identity of beneficial owners of corporate entities (individuals owning or controlling more than 25%); and understanding the nature and purpose of the business relationship.

3.3. We may use technology-assisted identity verification (including document verification and biometric checks) provided by regulated third-party providers.

3.4. We must complete CDD before establishing a business relationship or facilitating a transaction. We do not proceed where CDD cannot be satisfactorily completed.

#### 4. Enhanced Due Diligence (EDD)

4.1. We apply EDD where there is a higher risk of money laundering or terrorist financing, including: transactions involving politically exposed persons (PEPs), their family members, or known close associates; transactions involving high-risk third countries identified by HM Treasury or the Financial Action Task Force (FATF); complex or unusually large transactions with no apparent economic purpose; and situations where there are doubts about the veracity of identification documents.

4.2. EDD measures include: additional identity verification, enhanced scrutiny of source of funds and source of wealth, senior management approval for the business relationship, and ongoing enhanced monitoring.

#### 5. Sanctions Screening

5.1. We screen Users involved in property transactions against the Office of Financial Sanctions Implementation (OFSI) consolidated sanctions list and other relevant sanctions lists.

5.2. Sanctions matches are escalated to the MLRO immediately. We will not proceed with any transaction where a confirmed sanctions match is identified.

#### 6. Suspicious Activity Reporting

6.1. All Britestate staff are required to report any knowledge or suspicion of money laundering or terrorist financing to the nominated Money Laundering Reporting Officer (MLRO) immediately using the internal reporting procedure.

6.2. The MLRO will assess each internal report and, where appropriate, submit a Suspicious Activity Report (SAR) to the National Crime Agency (NCA) via the SAR Online system.

6.3. It is a criminal offence under POCA to "tip off" a person that a SAR has been or may be made, or that an investigation is being or may be conducted.

6.4. Consent from the NCA must be obtained before proceeding with a transaction that is the subject of a SAR ("defence against money laundering").

#### 7. Record Keeping

7.1. We retain all CDD records, transaction records, and internal SAR records for a minimum of 5 years from the end of the business relationship or the date of the transaction, whichever is later, in accordance with Regulation 40 of the MLR 2017.

7.2. Records are stored securely with access restricted to authorised personnel.

#### 8. Staff Training

8.1. All relevant staff receive AML training upon appointment and at least annually thereafter. Training covers: recognition of suspicious activity and red flag indicators; CDD and EDD procedures; internal and external reporting obligations; tipping-off restrictions; and sanctions compliance.

8.2. Training records are maintained as evidence of compliance.

#### 9. Board-Level Accountability

9.1. A member of Britestate's board of directors has been appointed as the officer responsible for AML compliance. This individual ensures that adequate resources are allocated to AML compliance and that the MLRO has appropriate authority and independence.

#### 10. MLRO Contact

Money Laundering Reporting Officer: [MLRO NAME]
Email: mlro@britestate.co.uk
Britestate Ltd, [REGISTERED ADDRESS]

For external concerns about money laundering on the Platform, contact: compliance@britestate.co.uk

---

### 3.8 MODERN SLAVERY STATEMENT

**Last updated: [DATE]
Financial year ending: [DATE]**

#### 1. Introduction

Britestate Ltd is committed to preventing modern slavery and human trafficking in our business and supply chains. This statement is made pursuant to Section 54 of the Modern Slavery Act 2015.

#### 2. Our Business

Britestate is a property technology platform connecting homebuyers, renters, sellers, landlords, estate agents, and service providers across the United Kingdom. We are a digital business with [NUMBER] employees.

#### 3. Our Supply Chains

Our supply chains principally consist of: cloud infrastructure providers (Supabase, Vercel, AWS); payment processors (Stripe); software services (PostHog, Sentry, Resend, MapTiler, Anthropic); and professional services (legal, accounting, marketing).

#### 4. Policies

We maintain policies that contribute to ensuring there is no modern slavery in our business or supply chains, including: this Modern Slavery Statement; our Employee Code of Conduct; our Supplier Code of Conduct; and our Whistleblowing Policy.

#### 5. Due Diligence

5.1. We assess the risk of modern slavery in our supply chains by: evaluating the nature and location of each supplier; reviewing supplier modern slavery statements where available; requiring key suppliers to confirm compliance with the Modern Slavery Act 2015; and monitoring for red flags.

5.2. In the property context, we are mindful that modern slavery can be linked to property through forced labour in construction, maintenance, or cleaning services. Service providers on our platform are required to confirm compliance with the Modern Slavery Act as a condition of registration.

#### 6. Training

Relevant staff receive training on modern slavery awareness, including how to identify and report concerns.

#### 7. Key Performance Indicators

We measure effectiveness through: percentage of key suppliers assessed for modern slavery risk; number of staff trained; number of concerns reported and investigated; and supplier compliance confirmation rate.

#### 8. Approval

This statement has been approved by the Board of Directors of Britestate Ltd and is signed by [NAME], [TITLE].

---

### 3.9 ACCESSIBILITY STATEMENT

**Last updated: [DATE]**

#### 1. Our Commitment

Britestate Ltd is committed to making our platform accessible to everyone, including people with disabilities. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA.

#### 2. Conformance Status

We believe our platform partially conforms to WCAG 2.1 Level AA. "Partially conforms" means that some parts of the content do not fully conform. We are working to address known issues.

#### 3. Known Issues

The following areas have known accessibility limitations:

- Some older property photos may lack alternative text descriptions. We are working with agents to ensure all new listings include alt text.
- Certain interactive map features (powered by MapLibre GL JS) may have limited keyboard accessibility. We provide an alternative list view for property search results.
- Some third-party embedded content (e.g., Stripe payment forms) may have accessibility limitations outside our direct control.

#### 4. Testing

We test accessibility using: automated scanning (axe-core); manual testing with screen readers (NVDA, VoiceOver); keyboard-only navigation testing; and colour contrast verification.

#### 5. Feedback

If you encounter accessibility barriers on Britestate, please contact us:

Email: accessibility@britestate.co.uk
Phone: [PHONE NUMBER]

We aim to respond within 5 working days and provide a resolution or workaround within 15 working days.

#### 6. Enforcement

If you are not satisfied with our response, you may contact the Equality Advisory Support Service (EASS) at equalityadvisoryservice.com.

---

### 3.10 COMPLAINTS PROCEDURE

**Last updated: [DATE]**

#### 1. Introduction

Britestate Ltd takes all complaints seriously and aims to resolve them fairly and promptly. This procedure explains how to make a complaint and what to expect.

#### 2. What You Can Complain About

You may complain about: the Platform's services, features, or performance; the conduct of another User (including an estate agent or service provider); data protection concerns; billing or payment disputes; content moderation decisions; or accessibility issues.

#### 3. How to Complain

**Step 1 — Contact Us.** Email complaints@britestate.co.uk or use the "Help & Support" section of the Platform. Please include your name, email, a description of the issue, and any relevant evidence (screenshots, reference numbers).

**Step 2 — Acknowledgement.** We will acknowledge your complaint within 2 working days and assign a reference number.

**Step 3 — Investigation.** We will investigate your complaint and aim to provide a full response within 15 working days. If the matter is complex, we may extend this to 30 working days, notifying you of the delay and the reason.

**Step 4 — Resolution.** Our response will explain our findings and any action we have taken or propose to take.

#### 4. Escalation

If you are not satisfied with our response:

**4.1. Internal Escalation.** You may request a review by a senior manager within 14 days of receiving our response. The review will be completed within 15 working days.

**4.2. External Escalation.** If you remain dissatisfied, you may refer your complaint to:

- **For data protection matters:** The Information Commissioner's Office (ico.org.uk, 0303 123 1113)
- **For estate agent conduct:** The Property Ombudsman (tpos.co.uk) or the Property Redress Scheme (theprs.co.uk)
- **For consumer disputes:** You may use an ADR provider certified by the Chartered Trading Standards Institute. Details of applicable ADR providers will be included in our final response to your complaint.
- **For online disputes (consumers):** The Online Dispute Resolution platform at ec.europa.eu/consumers/odr

#### 5. Complaints About Estate Agents

If your complaint relates to an estate agent registered on the Platform, we will: forward the complaint to the agent for their response; facilitate communication where appropriate; and if the matter is not resolved, advise you to contact the agent's redress scheme directly.

Britestate is not responsible for the professional conduct of estate agents or service providers on the Platform.

---

### 3.11 DISCLAIMER

**Last updated: [DATE]**

#### 1. No Professional Advice

1.1. Nothing on the Britestate platform constitutes legal, financial, mortgage, surveying, investment, tax, or valuation advice. All content is provided for general informational purposes only.

1.2. You should always consult a qualified, regulated professional before making any property-related decisions, including engaging a solicitor or licensed conveyancer for legal matters, a mortgage broker or financial adviser authorised by the FCA for financial matters, and a RICS-qualified surveyor for property condition assessments.

#### 2. Accuracy of Listings and Third-Party Content

2.1. Property listings, descriptions, photographs, floor plans, and virtual tours are provided by third parties (estate agents, landlords, sellers). Britestate does not independently verify this content and does not guarantee its accuracy, completeness, or currency.

2.2. It is your responsibility to verify all information (including price, tenure, condition, measurements, and planning status) before making any property-related decision.

#### 3. Valuations and Market Data

3.1. Any property valuations, price estimates, or market data displayed on the Platform (including AI-generated estimates) are based on publicly available data and algorithmic modelling. They are approximate indicators only and should not be relied upon as formal valuations.

3.2. For a formal property valuation, you should instruct a RICS-registered valuer.

#### 4. EPC and Energy Data

4.1. Energy Performance Certificate (EPC) data is sourced from the government's EPC register. While we endeavour to display current data, EPCs have a 10-year validity period and may not reflect recent improvements to a property.

#### 5. AI-Generated Content

5.1. Certain features on Britestate use artificial intelligence to generate property descriptions, recommendations, and insights. AI-generated content may contain inaccuracies or omissions. It is labelled as AI-generated and should be treated as a starting point, not a definitive source.

#### 6. Maps and Location Data

6.1. Maps and location information are provided by MapTiler and MapLibre GL JS. Map pin locations are approximate and may not reflect the exact position of a property. Walk scores, transport links, and local amenities are based on third-party data and may not be fully current or accurate.

#### 7. Third-Party Links

7.1. The Platform may contain links to third-party websites and services. Britestate is not responsible for the content, privacy practices, or availability of those sites. Inclusion of a link does not constitute endorsement.

#### 8. Platform Intermediary Status

8.1. Britestate acts as a technology platform intermediary. We facilitate connections between buyers, sellers, landlords, tenants, estate agents, and service providers, but we are not a party to any transaction.

8.2. We do not act as an estate agent, letting agent, surveyor, solicitor, mortgage broker, or any other regulated professional. Where our Users are regulated professionals, their regulatory obligations remain their own responsibility.

#### 9. Limitation of Liability

9.1. To the maximum extent permitted by applicable law, Britestate Ltd excludes all liability for any loss or damage arising from your use of the Platform or your reliance on information provided by third parties through the Platform.

9.2. Nothing in this disclaimer excludes or limits our liability for: death or personal injury caused by our negligence; fraud or fraudulent misrepresentation; or any liability that cannot be excluded under the Consumer Rights Act 2015 or other applicable law.

#### 10. Governing Law

10.1. This disclaimer is governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction, subject to the consumer jurisdiction rights described in our Terms of Service.

---

### 3.12 FEE TRANSPARENCY PAGE (NEW)

**Last updated: [DATE]**

#### 1. Our Commitment to Transparency

Britestate Ltd believes in clear, upfront pricing with no hidden fees. This page sets out all fees associated with using the Platform, in accordance with CMA guidance on fee transparency.

#### 2. For Homebuyers and Renters

Searching for properties, setting alerts, saving favourites, and contacting agents is free. There are no fees for homebuyers or renters using the Platform.

#### 3. For Sellers

Listing your property through an estate agent on Britestate is covered by your agreement with the agent. Britestate does not charge sellers directly.

If you use Britestate's direct listing service (where available), fees are displayed at the point of listing and must be confirmed before your listing goes live.

#### 4. For Landlords

Listing rental properties is [free / part of a subscription — specify]. Landlords are responsible for any fees charged by their managing agent, which are separate from Britestate's fees.

#### 5. For Estate Agents

| Plan | Monthly Fee (excl. VAT) | Listings Included | Premium Features |
|---|---|---|---|
| Starter | £[X] | Up to [X] | Basic analytics |
| Professional | £[X] | Up to [X] | Advanced analytics, priority support |
| Enterprise | Custom | Unlimited | API access, dedicated account manager |

Fees are payable monthly or annually in advance. Annual billing provides a [X]% discount. All fees are subject to VAT at the prevailing rate.

**Platform Commission:** A commission of 2.5% applies to transactions facilitated through the Platform's referral or lead generation features. This is clearly displayed before any transaction is confirmed and is deducted automatically via Stripe Connect.

**Cancellation:** You may cancel your subscription at any time. If you cancel within the first 14 days (cooling-off period under the Consumer Contracts Regulations 2013), you are entitled to a full refund less any proportionate usage. After 14 days, your subscription remains active until the end of the current billing period.

#### 6. For Service Providers

Service providers (surveyors, conveyancers, mortgage brokers, tradespeople) may list their services on the Britestate marketplace. Listing fees and commission rates are displayed on the marketplace registration page and confirmed before sign-up.

#### 7. Payment Processing

All payments are processed securely by Stripe. Britestate does not store your card details. Stripe's fees are included in the prices shown and are not charged separately to you.

#### 8. Changes to Fees

We will provide at least 30 days' written notice before changing any fees. Price increases do not apply to prepaid annual subscriptions until renewal.

---

### 3.13 AI TRANSPARENCY NOTICE (NEW)

**Last updated: [DATE]**

#### 1. How We Use AI

Britestate uses artificial intelligence to enhance your property search experience. We believe in being transparent about when and how AI is used.

#### 2. AI-Powered Features

**Property Recommendations:** Our recommendation engine uses your search history, saved properties, and stated preferences to suggest properties you might be interested in. This is powered by vector embeddings (pgvector) and Anthropic Claude.

**Valuation Estimates:** We provide indicative property value estimates based on comparable sales data, property attributes, and market trends. These are not formal valuations and should not be relied upon for purchasing or lending decisions.

**Search Matching:** Our search algorithm uses AI to understand natural-language search queries and match them to relevant listings.

**Content Generation:** Some property descriptions and summaries may be generated or enhanced by AI. These are reviewed by the listing agent or owner before publication and are clearly labelled.

#### 3. Your Data and AI

3.1. Your search and browsing data is used to personalise recommendations. You can opt out of personalised recommendations in your privacy settings at any time.

3.2. We do not use your personal data to train AI models. Data sent to Anthropic for recommendation processing is not retained by Anthropic for model training.

3.3. No solely automated decisions with legal or similarly significant effects are made about you. Where AI outputs influence decisions (e.g., property valuation estimates), human oversight is maintained.

#### 4. Limitations

AI-generated outputs may contain inaccuracies. They are intended as helpful tools, not definitive answers. Always verify important information independently and seek professional advice for significant decisions.

#### 5. Your Rights

You have the right to: opt out of AI-powered personalisation; request human review of AI-generated outputs that affect you; receive meaningful information about how our AI systems work; and object to profiling under Article 21 of UK GDPR. Contact privacy@britestate.co.uk to exercise these rights.

---

## PART 4: IMPLEMENTATION RECOMMENDATIONS

1. **Engage a solicitor** to review all copy before publication. This research document is guidance, not legal advice.
2. **Complete all [PLACEHOLDER] values** — company number, registered address, ICO registration, HMRC AML reference, MLRO name.
3. **Add the two new pages** (Fee Transparency, AI Transparency) to the legal hub navigation.
4. **Expand the Terms of Service** from 8 to 18 sections as drafted above — covering role-specific terms, payments, AI, dispute resolution, and standard boilerplate.
5. **Expand the Privacy Policy** from 11 to 14 sections — adding children's data, automated decision-making, and expanded sub-processor/retention tables.
6. **Update the Cookie Policy** to reflect DUAA 2025 changes (analytics cookies now opt-out where purely statistical).
7. **Replace all TODO markers** in the codebase with the final reviewed copy.
8. **Schedule annual reviews** of all legal pages, with interim updates triggered by regulatory changes.
9. **Implement version history** — consider adding a changelog or "previous versions" section to key pages.
10. **Test the GDPR rights form** end-to-end including rate limiting, email notifications, and the 30-day response workflow.
