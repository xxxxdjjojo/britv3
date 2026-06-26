import type { BlogAuthor } from "./types";

/**
 * Shared author profiles. Articles reference these so bios and titles stay
 * consistent across the blog.
 */
export const AUTHORS = {
  sarahMitchell: {
    name: "Sarah Mitchell",
    initials: "SM",
    title: "Property Expert at TrueDeed",
    bio: "Sarah has spent over a decade helping first-time buyers navigate the UK property market. A former solicitor, she specialises in making complex legal and financial topics accessible to everyday buyers.",
  },
  jamesOkafor: {
    name: "James Okafor",
    initials: "JO",
    title: "Market Analyst at TrueDeed",
    bio: "James tracks regional housing data, mortgage pricing, and buyer demand across the UK, translating market signals into practical guidance for movers and investors.",
  },
  priyaNair: {
    name: "Priya Nair",
    initials: "PN",
    title: "Lettings & Renting Editor at TrueDeed",
    bio: "Priya covers tenant rights, lettings regulation, and the realities of renting in the UK, helping both tenants and landlords stay on the right side of the rules.",
  },
  davidChen: {
    name: "David Chen",
    initials: "DC",
    title: "Landlord & Investment Specialist at TrueDeed",
    bio: "David advises portfolio landlords on compliance, tax, and yield. He has managed buy-to-let and HMO properties across England for fifteen years.",
  },
  rachelHughes: {
    name: "Rachel Hughes",
    initials: "RH",
    title: "Homes Editor at TrueDeed",
    bio: "Rachel writes about home improvements, energy performance, and the design decisions that add value and make a property easier to sell.",
  },
  tomBrennan: {
    name: "Tom Brennan",
    initials: "TB",
    title: "Selling & Estate Agency Editor at TrueDeed",
    bio: "A former estate agent, Tom shares insider tactics on pricing, presentation, and negotiation to help sellers achieve faster sales at stronger prices.",
  },
} as const satisfies Record<string, BlogAuthor>;
