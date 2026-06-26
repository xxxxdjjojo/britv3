import type { BlogPost } from "../types";
import { AUTHORS } from "../authors";

export const post: BlogPost = {
  slug: "landlord-tax-changes-2026",
  title: "Landlord Tax in 2026: What Every UK Landlord Needs to Know",
  excerpt:
    "From Section 24 mortgage interest relief to Making Tax Digital, here is a plain-English guide to the tax rules shaping landlord profits in 2026.",
  category: "Landlord Tips",
  author: AUTHORS.davidChen,
  date: "2026-05-14",
  dateLabel: "14 May 2026",
  readTime: "8 min read",
  heroImage: "/blog/landlord-tax-changes-2026.webp",
  heroAlt:
    "A landlord sat at a kitchen table reviewing rental accounts and tax paperwork on a laptop",
  keywords: [
    "landlord tax 2026",
    "Section 24 mortgage interest relief",
    "buy-to-let tax",
    "Making Tax Digital landlords",
  ],
  seo: {
    title: "Landlord Tax 2026: Section 24, MTD & Allowances | TrueDeed",
    description:
      "Landlord tax 2026 explained: Section 24 mortgage interest relief, Making Tax Digital, CGT and the allowances that decide your real rental profit.",
  },
  body: [
    {
      type: "paragraph",
      text: "Understanding landlord tax in 2026 is no longer optional admin — it is the difference between a portfolio that quietly compounds and one that drains cash every month. The rules that govern how rental income is taxed have tightened steadily since the mid-2010s, and several of those changes have now fully bedded in. If you let property in the UK, this guide walks through the levers that matter most this tax year: how Section 24 mortgage interest relief works in practice, what Making Tax Digital means for your record-keeping, and the allowances that still work in your favour.",
    },
    {
      type: "h2",
      text: "Section 24: why your mortgage is no longer a simple deduction",
    },
    {
      type: "paragraph",
      text: "The single biggest shift for individual landlords remains Section 24 mortgage interest relief, fully in force since 2020. Before it, landlords could deduct mortgage interest from rental income before calculating tax. Now you cannot. Instead, you pay income tax on your full rental income and receive a separate tax credit worth 20% of your finance costs — interest on buy-to-let mortgages, and certain fees.",
    },
    {
      type: "paragraph",
      text: "For a basic-rate taxpayer the effect is broadly neutral. For higher and additional-rate taxpayers it is not. Because your full rent is added to your income first, leveraged landlords can be pushed into a higher tax band, then only credited back at 20%. The result is that some highly geared portfolios are taxed on profit they never actually keep.",
    },
    {
      type: "h3",
      text: "A worked example",
    },
    {
      type: "paragraph",
      text: "Imagine a higher-rate landlord receiving £20,000 in annual rent with £9,000 of mortgage interest. Under the old rules they would have been taxed on £11,000 of profit. Today they are taxed on the full £20,000 at 40% (£8,000), then receive a 20% credit on the £9,000 interest (£1,800), leaving an £6,200 bill — noticeably more than the £4,400 the old system would have produced.",
    },
    {
      type: "blockquote",
      text: "Section 24 does not punish profit — it punishes leverage. The more of your return that comes from a mortgaged deposit rather than equity, the harder the maths bites.",
    },
    {
      type: "h2",
      text: "Should you incorporate?",
    },
    {
      type: "paragraph",
      text: "Section 24 does not apply to companies, so limited-company landlords can still deduct mortgage interest as a business expense and pay corporation tax on the remainder. That is why so many new buy-to-let purchases now complete inside a limited company. But incorporation is not a free win — extracting profit as dividends triggers a second layer of tax, mortgage rates for company borrowers are typically higher, and moving existing personally-held property into a company can crystallise capital gains tax and stamp duty.",
    },
    {
      type: "list",
      items: [
        "Company structures suit higher-rate taxpayers building a portfolio over the long term and reinvesting profit.",
        "Personal ownership often still wins for basic-rate taxpayers, or those holding one or two unmortgaged properties.",
        "Transferring existing property into a company is a sale in HMRC's eyes — model the CGT and SDLT before you move.",
        "Always take advice from a qualified accountant before incorporating; the right answer is genuinely individual.",
      ],
    },
    {
      type: "h2",
      text: "Making Tax Digital is coming for landlords",
    },
    {
      type: "paragraph",
      text: "Making Tax Digital (MTD) for Income Tax is being phased in for landlords and the self-employed. Those with qualifying property and trading income above the published threshold will need to keep digital records and submit quarterly updates to HMRC using compatible software, rather than filing a single annual Self Assessment return. The thresholds step down over time, so even smaller landlords should expect to be brought in eventually.",
    },
    {
      type: "paragraph",
      text: "The practical takeaway is simple: move your bookkeeping into proper software now, while it is voluntary, rather than scrambling when it becomes mandatory. Clean, digital records also make it far easier to claim every allowable expense — which is where most landlords leave money on the table.",
    },
    {
      type: "h2",
      text: "The allowances and deductions still working for you",
    },
    {
      type: "paragraph",
      text: "Plenty of legitimate deductions survive Section 24. You can still offset day-to-day running costs against rental income before tax:",
    },
    {
      type: "list",
      items: [
        "Letting agent and property management fees",
        "Repairs and maintenance (but not improvements, which are capital)",
        "Landlord insurance, ground rent and service charges",
        "Accountancy fees and the cost of advertising for tenants",
        "Replacement of domestic items relief for like-for-like furnishings",
      ],
    },
    {
      type: "paragraph",
      text: "On the capital side, remember that selling a buy-to-let triggers capital gains tax, and the annual CGT exempt amount has been cut sharply in recent years — so disposals need planning. Spreading sales across tax years, using both spouses' allowances, and timing completion carefully can all reduce the bill.",
    },
    {
      type: "h2",
      text: "Know your real yield before you buy",
    },
    {
      type: "paragraph",
      text: "Tax changes everything about what a property actually earns. A headline 6% gross yield can shrink to something far less appealing once Section 24, management fees and maintenance are stripped out. Before you commit to a purchase — or decide whether to keep an existing let — run the numbers on a net basis.",
    },
    {
      type: "cta",
      text: "Work out the true return on a rental property after costs with our free calculator.",
      href: "/tools/rental-yield-calculator",
      label: "Try the rental yield calculator",
    },
    {
      type: "h2",
      text: "The bottom line for 2026",
    },
    {
      type: "paragraph",
      text: "Landlord tax in 2026 rewards landlords who plan and penalises those who drift. Get your structure right for your tax band, move your records into MTD-ready software early, claim every allowable expense, and always assess a deal on its net yield rather than its gross headline. Done well, buy-to-let remains a viable investment — but the margin for sloppy admin has never been thinner. When in doubt, a few hundred pounds spent with a property-specialist accountant routinely saves multiples of that at filing time.",
    },
  ],
};
