import type { BlogPost } from "../types";
import { AUTHORS } from "../authors";

export const post: BlogPost = {
  slug: "mortgage-affordability-how-much-can-i-borrow",
  title: "How Much Can I Borrow? UK Mortgage Affordability",
  excerpt:
    "How lenders decide what you can borrow in 2026 — income multiples, affordability assessments, stress tests and the outgoings that quietly shrink your budget, with worked examples.",
  category: "Legal & Finance",
  author: AUTHORS.jamesOkafor,
  date: "2026-06-29",
  dateLabel: "29 June 2026",
  readTime: "11 min read",
  heroImage: "/blog/mortgage-affordability-how-much-can-i-borrow.webp",
  heroAlt:
    "A couple sitting with a mortgage adviser reviewing their income and outgoings to work out how much they can borrow.",
  keywords: [
    "how much can i borrow mortgage",
    "mortgage affordability calculator",
    "how much can I borrow 4.5 times salary",
    "mortgage income multiple",
  ],
  seo: {
    title: "How Much Can I Borrow? Mortgage Affordability",
    description:
      "How much can I borrow on a mortgage? How lenders use income multiples of ~4.5x, affordability checks and stress tests in 2026, with worked examples.",
  },
  hub: "first-time-buyer",
  journeyStage: "Consideration",
  body: [
    {
      type: "paragraph",
      text: "The question every first-time buyer asks is how much can I borrow on a mortgage. As a rough guide, UK lenders commonly cap lending at around 4.5 times your annual income — so a household earning £40,000 might borrow roughly £180,000, subject to checks. But that multiple is only a starting point. Lenders then run a detailed affordability assessment of your actual income and outgoings, and stress-test the loan against interest rates higher than today's to make sure you could still cope if rates rose. Your deposit, credit profile, debts and childcare costs all move the final figure. In short: start with the multiple, then adjust for real life.",
    },
    {
      type: "paragraph",
      text: "This guide explains how lenders really decide, why two people on the same salary can be offered very different amounts, and the practical levers that increase — or shrink — your borrowing power, with worked examples throughout.",
    },
    {
      type: "h2",
      text: "How lenders decide how much you can borrow",
    },
    {
      type: "paragraph",
      text: "Lenders combine two tests. First, an income multiple sets a broad ceiling — most lenders work to around 4.5 times your gross annual income, though some stretch further for higher earners or certain professions. Second, and more decisive, is an affordability assessment: the lender looks at your actual monthly income against your committed outgoings and everyday spending to judge whether the mortgage payments are genuinely sustainable. The affordability test can pull your maximum below the income-multiple ceiling — which is why the multiple alone never tells the whole story.",
    },
    {
      type: "h2",
      text: "The 4.5x income multiple explained",
    },
    {
      type: "paragraph",
      text: "The loan-to-income (LTI) multiple is the quickest way to sketch your ballpark. Multiply your gross annual income by about 4.5 and you have a rough upper bound on the loan. On a joint application, lenders typically use a combined figure — often both incomes added together, sometimes the higher income plus a portion of the second. Regulators limit how much of a lender's book can sit above 4.5x, so higher multiples exist but are rationed and usually reserved for strong applicants with larger deposits.",
    },
    {
      type: "list",
      items: [
        "£30,000 income × 4.5 = around £135,000 loan (single applicant, before affordability checks).",
        "£50,000 income × 4.5 = around £225,000 loan (single applicant, before affordability checks).",
        "£40,000 + £35,000 joint income = £75,000 × 4.5 = around £337,500 combined (before affordability checks).",
        "These are ceilings, not guarantees — the affordability assessment can lower them.",
      ],
    },
    {
      type: "cta",
      text: "See a realistic borrowing figure for your income and outgoings in under a minute with our free affordability calculator.",
      href: "/tools/affordability-calculator",
      label: "Check what I can borrow",
    },
    {
      type: "h2",
      text: "The affordability assessment: income vs outgoings",
    },
    {
      type: "paragraph",
      text: "The affordability assessment is where the income multiple meets reality. The lender totals your reliable income — salary, and often a haircut on bonus, overtime or commission — then subtracts your committed and typical outgoings to see what is left for a mortgage. Regular commitments (loans, car finance, credit-card balances, childcare, other dependants) reduce the amount available, sometimes sharply. This is why two applicants earning the same salary can be offered very different loans: the one with a car loan and two children under five will usually be able to borrow less than the one with no debts and no dependants.",
    },
    {
      type: "h3",
      text: "What lenders count as income",
    },
    {
      type: "list",
      items: [
        "Basic salary — counted in full for employed applicants.",
        "Bonus, overtime and commission — often counted at a reduced percentage, if at all.",
        "Self-employed profits — usually averaged over two to three years of accounts.",
        "Some benefits and secondary income — accepted by some lenders but not others.",
      ],
    },
    {
      type: "h2",
      text: "Stress testing: could you cope if rates rose?",
    },
    {
      type: "paragraph",
      text: "Lenders do not just check that you can afford today's rate — they stress-test the loan against a higher rate to make sure you could still keep up if borrowing costs climbed. In practice they add a margin to the rate you would actually pay and confirm the payments would still be manageable. With 2026 rates already elevated compared with the lows of the early 2020s, this stress test bites harder than it did a few years ago, and it is a common reason a buyer's realistic maximum comes in below the headline 4.5x figure. Always check live rates when you plan, rather than assuming yesterday's numbers still hold.",
    },
    {
      type: "h2",
      text: "What reduces your borrowing power",
    },
    {
      type: "paragraph",
      text: "Several everyday factors quietly shrink the amount a lender will offer. Understanding them lets you strengthen your application before you apply — sometimes clearing a single debt frees up thousands in borrowing capacity.",
    },
    {
      type: "list",
      items: [
        "Existing debts — personal loans, car finance and outstanding credit-card balances all reduce what is left for a mortgage.",
        "Dependants and childcare — children and other dependants add committed monthly costs the lender must account for.",
        "A small deposit — a low deposit means a higher loan-to-value, often narrowing your lender choice and rates.",
        "An impaired credit history — missed payments or defaults can lower both your maximum and the rates on offer.",
        "Irregular income — bonus, commission and self-employed earnings are usually discounted rather than counted in full.",
      ],
    },
    {
      type: "h2",
      text: "Single vs joint applications",
    },
    {
      type: "paragraph",
      text: "Applying jointly usually lifts your borrowing power because two incomes are assessed together — but it also means both sets of outgoings, debts and credit histories are in the mix. A second applicant with a strong income and clean credit can substantially raise your ceiling; one carrying heavy debts or credit problems can drag it down. There is no single right answer: for some couples a joint application unlocks the home they want, while for others the sensible route is to apply on the stronger single income. A broker can model both before you commit.",
    },
    {
      type: "blockquote",
      text: "The income multiple gives you a headline number in seconds. The affordability assessment decides what you can actually borrow. Treat the first as a sketch and the second as the real answer.",
    },
    {
      type: "h2",
      text: "Worked example: from salary to real budget",
    },
    {
      type: "paragraph",
      text: "Consider a couple earning £38,000 and £32,000 — a combined £70,000. At 4.5x, the income-multiple ceiling is around £315,000. But say they have £280 a month in car finance and £150 a month in childcare-related costs. The affordability assessment factors those in, and the stress test confirms the payments would still be manageable at a higher rate. In practice the lender might offer closer to £280,000 to £300,000 rather than the full ceiling. Clear the car finance, and their sustainable maximum could rise again. This is the pattern to expect: a clean, low-outgoings profile lands nearer the multiple; committed debts pull it down. Use a calculator to see your own numbers.",
    },
    {
      type: "cta",
      text: "Turn your borrowing figure into a real monthly payment and total-cost estimate with our mortgage calculator.",
      href: "/tools/mortgage-calculator",
      label: "Estimate my repayments",
    },
    {
      type: "links",
      heading: "Continue your first-time buyer journey",
      items: [
        {
          href: "/blog/mortgage-agreement-in-principle",
          label: "Mortgage Agreement in Principle: what it is",
        },
        {
          href: "/blog/mortgage-interest-rates-uk-2026",
          label: "UK mortgage interest rates in 2026",
        },
        {
          href: "/blog/how-much-deposit-to-buy-a-house-2026",
          label: "How much deposit do you actually need?",
        },
        {
          href: "/blog/stamp-duty-first-time-buyer-guide-2026",
          label: "Stamp duty for first-time buyers explained",
        },
      ],
    },
    {
      type: "faq",
      items: [
        {
          question: "How much can I borrow on 4.5 times my salary?",
          answer:
            "Multiply your gross annual income by 4.5 for a rough ceiling: a £40,000 salary gives around £180,000, and a £70,000 joint income gives around £315,000. This is only a starting point — the lender's affordability assessment and stress test can bring the final figure lower.",
        },
        {
          question: "Why can I borrow less than 4.5 times my income?",
          answer:
            "The 4.5x multiple is a ceiling, not a guarantee. The affordability assessment subtracts your committed outgoings — debts, car finance, childcare — from your income, and the stress test checks you could cope at a higher rate. Together these often reduce your realistic maximum.",
        },
        {
          question: "Does a joint mortgage let me borrow more?",
          answer:
            "Usually yes, because two incomes are assessed together, which raises the ceiling. But both applicants' debts, outgoings and credit histories also count. A second applicant with heavy debts or credit problems can reduce the amount offered, so joint is not automatically better.",
        },
        {
          question: "What is a mortgage stress test?",
          answer:
            "A stress test checks you could still afford the mortgage if interest rates rose. The lender adds a margin to your actual rate and confirms the payments would remain manageable. With 2026 rates elevated, this test is a common reason a buyer's maximum comes in below the headline multiple.",
        },
        {
          question: "How can I increase how much I can borrow?",
          answer:
            "Clear or reduce existing debts, avoid taking on new credit before applying, save a larger deposit, and keep your credit file clean. Reducing committed monthly outgoings frees up income the lender can count towards the mortgage, which can lift your sustainable maximum.",
        },
      ],
    },
    {
      type: "links",
      heading: "Trusted sources",
      items: [
        {
          href: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/how-much-can-you-afford-to-borrow-for-a-mortgage",
          label: "MoneyHelper — How much can you afford to borrow",
        },
        {
          href: "https://www.bankofengland.co.uk/knowledgebank/what-is-a-mortgage",
          label: "Bank of England — What is a mortgage?",
        },
      ],
    },
    {
      type: "paragraph",
      text: "This guide is for informational purposes only and does not constitute financial advice. Income multiples, affordability rules and stress-test assumptions vary by lender and by your circumstances — always speak to a qualified mortgage adviser before making decisions.",
    },
  ],
};
