import type { SoldPriceRecord, SoldPriceDetail } from "@/types/areas";

// --- Helper to generate records for an area ---
const TYPE_LABELS: Record<string, string> = { D: "Detached", S: "Semi-Detached", T: "Terraced", F: "Flat", O: "Other" };

function fmt(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function makeRecord(
  id: string, address: string, postcode: string, type: "D" | "S" | "T" | "F" | "O",
  beds: number, price: number, date: string, areaSlug: string,
  opts: { oldNew?: "Y" | "N"; tenure?: "F" | "L"; vsAsking?: number | null } = {},
): SoldPriceRecord {
  const slug = `${address.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${postcode.toLowerCase().replace(/\s+/g, "-")}`;
  return {
    id, slug, address, postcode,
    propertyType: type, propertyTypeLabel: TYPE_LABELS[type] ?? "Other",
    beds, price, priceFormatted: fmt(price),
    date, dateFormatted: fmtDate(date),
    oldNew: opts.oldNew ?? "N", tenure: opts.tenure ?? "F",
    tenureLabel: (opts.tenure ?? "F") === "F" ? "Freehold" : "Leasehold",
    vsAsking: opts.vsAsking ?? null,
    areaSlug,
  };
}

// --- Area sold price data ---
const isleworth: SoldPriceRecord[] = [
  makeRecord("sp-001", "14 South Street", "TW7 7BG", "T", 3, 485000, "2026-01-15", "isleworth", { vsAsking: -2 }),
  makeRecord("sp-002", "7 Bridge Road", "TW7 6BA", "S", 4, 625000, "2025-12-03", "isleworth", { vsAsking: -3 }),
  makeRecord("sp-003", "42 Church Street", "TW7 6BE", "F", 2, 345000, "2025-11-18", "isleworth", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-004", "91 London Road", "TW7 5BJ", "T", 3, 510000, "2025-10-22", "isleworth", { vsAsking: 1 }),
  makeRecord("sp-005", "15 Park Road", "TW7 5DN", "D", 5, 895000, "2025-09-30", "isleworth", { vsAsking: -4 }),
  makeRecord("sp-006", "8 Spring Grove", "TW7 5BH", "T", 2, 425000, "2025-09-14", "isleworth"),
  makeRecord("sp-007", "33 Twickenham Road", "TW7 6AF", "S", 3, 560000, "2025-08-28", "isleworth", { vsAsking: -2 }),
  makeRecord("sp-008", "6 Worton Road", "TW7 6ER", "F", 1, 275000, "2025-08-05", "isleworth", { tenure: "L" }),
  makeRecord("sp-009", "22 Linkfield Road", "TW7 6QG", "T", 3, 498000, "2025-07-17", "isleworth", { vsAsking: -1 }),
  makeRecord("sp-010", "55 Wood Lane", "TW7 5EG", "D", 4, 785000, "2025-06-24", "isleworth", { vsAsking: -3 }),
  makeRecord("sp-011", "19 Northumberland Avenue", "TW7 5EP", "S", 3, 545000, "2025-05-30", "isleworth", { vsAsking: 2 }),
  makeRecord("sp-012", "3 Swan Street", "TW7 6RJ", "F", 2, 355000, "2025-04-22", "isleworth", { tenure: "L", vsAsking: -1 }),
];

const islington: SoldPriceRecord[] = [
  makeRecord("sp-020", "14 Canonbury Square", "N1 2AL", "T", 4, 1450000, "2026-02-10", "islington", { vsAsking: -3 }),
  makeRecord("sp-021", "8 Upper Street", "N1 0PQ", "F", 2, 625000, "2026-01-22", "islington", { tenure: "L", vsAsking: -2 }),
  makeRecord("sp-022", "31 Barnsbury Road", "N1 0ES", "T", 3, 1280000, "2025-12-15", "islington", { vsAsking: -4 }),
  makeRecord("sp-023", "5 Liverpool Road", "N1 0RJ", "F", 1, 485000, "2025-11-28", "islington", { tenure: "L" }),
  makeRecord("sp-024", "72 Essex Road", "N1 8LT", "T", 3, 1150000, "2025-10-19", "islington", { vsAsking: -2 }),
  makeRecord("sp-025", "19 Noel Road", "N1 8HA", "T", 5, 2100000, "2025-09-30", "islington", { vsAsking: -5 }),
  makeRecord("sp-026", "44 Cross Street", "N1 2BG", "F", 2, 595000, "2025-08-14", "islington", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-027", "6 Duncan Terrace", "N1 8BZ", "T", 4, 1680000, "2025-07-22", "islington", { vsAsking: -3 }),
  makeRecord("sp-028", "11 Dagmar Passage", "N1 2DN", "F", 1, 440000, "2025-06-18", "islington", { tenure: "L" }),
  makeRecord("sp-029", "28 Cloudesley Road", "N1 0EN", "S", 3, 1050000, "2025-05-02", "islington", { vsAsking: 1 }),
];

const camden: SoldPriceRecord[] = [
  makeRecord("sp-040", "8 Regent's Park Road", "NW1 8UR", "T", 4, 1850000, "2026-01-28", "camden", { vsAsking: -4 }),
  makeRecord("sp-041", "15 Chalk Farm Road", "NW1 8AG", "F", 2, 585000, "2025-12-10", "camden", { tenure: "L", vsAsking: -2 }),
  makeRecord("sp-042", "22 Kentish Town Road", "NW1 9NX", "T", 3, 1120000, "2025-11-05", "camden", { vsAsking: -1 }),
  makeRecord("sp-043", "3 Delancey Street", "NW1 7NL", "F", 1, 465000, "2025-10-15", "camden", { tenure: "L" }),
  makeRecord("sp-044", "41 Arlington Road", "NW1 7ER", "T", 3, 1380000, "2025-09-22", "camden", { vsAsking: -3 }),
  makeRecord("sp-045", "9 Hawley Crescent", "NW1 8NP", "F", 2, 535000, "2025-08-08", "camden", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-046", "56 Camden Square", "NW1 9XA", "T", 5, 2250000, "2025-07-14", "camden", { vsAsking: -5 }),
  makeRecord("sp-047", "17 Parkway", "NW1 7AA", "S", 3, 980000, "2025-06-20", "camden", { vsAsking: 1 }),
  makeRecord("sp-048", "7 Plender Street", "NW1 0JT", "F", 1, 415000, "2025-05-12", "camden", { tenure: "L" }),
  makeRecord("sp-049", "33 Bayham Street", "NW1 0EY", "T", 3, 1200000, "2025-04-18", "camden", { vsAsking: -2 }),
];

const headingley: SoldPriceRecord[] = [
  makeRecord("sp-060", "14 Headingley Lane", "LS6 1BL", "T", 3, 285000, "2026-02-05", "headingley", { vsAsking: 2 }),
  makeRecord("sp-061", "8 Cardigan Road", "LS6 3AG", "T", 4, 340000, "2025-12-18", "headingley", { vsAsking: 1 }),
  makeRecord("sp-062", "22 St Michael's Lane", "LS6 3BR", "S", 3, 310000, "2025-11-22", "headingley", { vsAsking: -1 }),
  makeRecord("sp-063", "5 Victoria Road", "LS6 1DR", "T", 2, 225000, "2025-10-30", "headingley"),
  makeRecord("sp-064", "31 Ash Road", "LS6 3HD", "T", 3, 265000, "2025-09-15", "headingley", { vsAsking: 1 }),
  makeRecord("sp-065", "12 Shire Oak Road", "LS6 2DE", "D", 5, 520000, "2025-08-28", "headingley", { vsAsking: -3 }),
  makeRecord("sp-066", "7 Bennett Road", "LS6 3HN", "T", 3, 275000, "2025-07-12", "headingley", { vsAsking: -1 }),
  makeRecord("sp-067", "44 North Lane", "LS6 3HG", "F", 2, 185000, "2025-06-25", "headingley", { tenure: "L" }),
  makeRecord("sp-068", "19 Kirkstall Lane", "LS6 3BP", "S", 4, 365000, "2025-05-18", "headingley", { vsAsking: -2 }),
  makeRecord("sp-069", "3 Hyde Park Road", "LS6 1AH", "T", 3, 248000, "2025-04-08", "headingley"),
];

const clifton: SoldPriceRecord[] = [
  makeRecord("sp-080", "8 Royal York Crescent", "BS8 4JZ", "T", 4, 850000, "2026-01-20", "clifton", { vsAsking: -3 }),
  makeRecord("sp-081", "15 Clifton Park Road", "BS8 3HN", "S", 3, 625000, "2025-12-08", "clifton", { vsAsking: -2 }),
  makeRecord("sp-082", "3 Sion Hill", "BS8 4BB", "F", 2, 385000, "2025-11-14", "clifton", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-083", "22 Pembroke Road", "BS8 3BA", "T", 3, 580000, "2025-10-28", "clifton", { vsAsking: 1 }),
  makeRecord("sp-084", "41 Whiteladies Road", "BS8 2LY", "F", 1, 295000, "2025-09-16", "clifton", { tenure: "L" }),
  makeRecord("sp-085", "9 Clifton Down Road", "BS8 4AE", "D", 5, 1150000, "2025-08-22", "clifton", { vsAsking: -4 }),
  makeRecord("sp-086", "17 Caledonia Place", "BS8 4DJ", "T", 4, 780000, "2025-07-30", "clifton", { vsAsking: -2 }),
  makeRecord("sp-087", "6 Princess Victoria Street", "BS8 4BX", "F", 2, 365000, "2025-06-15", "clifton", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-088", "28 The Mall", "BS8 4JG", "T", 3, 545000, "2025-05-20", "clifton"),
  makeRecord("sp-089", "11 Alma Vale Road", "BS8 2HL", "S", 3, 595000, "2025-04-12", "clifton", { vsAsking: 2 }),
];

const ancoats: SoldPriceRecord[] = [
  makeRecord("sp-100", "14 Cutting Room Square", "M4 6EG", "F", 2, 285000, "2026-02-12", "ancoats", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-101", "8 Jersey Street", "M4 6JA", "F", 1, 215000, "2025-12-20", "ancoats", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-102", "31 Bengal Street", "M4 6AQ", "F", 2, 265000, "2025-11-10", "ancoats", { tenure: "L", oldNew: "Y" }),
  makeRecord("sp-103", "5 Blossom Street", "M4 6AJ", "F", 1, 198000, "2025-10-18", "ancoats", { tenure: "L", vsAsking: -2 }),
  makeRecord("sp-104", "22 Pollard Street", "M4 7HP", "T", 3, 325000, "2025-09-25", "ancoats", { vsAsking: 2 }),
  makeRecord("sp-105", "9 Cotton Street", "M4 5BD", "F", 2, 295000, "2025-08-14", "ancoats", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-106", "15 George Leigh Street", "M4 5DG", "T", 2, 280000, "2025-07-22", "ancoats"),
  makeRecord("sp-107", "3 Advent Way", "M4 7AT", "F", 1, 225000, "2025-06-30", "ancoats", { tenure: "L" }),
  makeRecord("sp-108", "41 Oldham Road", "M4 5JX", "T", 3, 310000, "2025-05-15", "ancoats", { vsAsking: -1 }),
  makeRecord("sp-109", "7 Murray Street", "M4 6HS", "F", 2, 275000, "2025-04-20", "ancoats", { tenure: "L", vsAsking: -2 }),
];

const edgbaston: SoldPriceRecord[] = [
  makeRecord("sp-120", "14 Calthorpe Road", "B15 1QP", "D", 5, 685000, "2026-01-25", "edgbaston", { vsAsking: -3 }),
  makeRecord("sp-121", "8 Hagley Road", "B16 8PE", "S", 4, 445000, "2025-12-12", "edgbaston", { vsAsking: -2 }),
  makeRecord("sp-122", "22 Priory Road", "B5 7UG", "T", 3, 325000, "2025-11-08", "edgbaston", { vsAsking: -1 }),
  makeRecord("sp-123", "3 Wheeleys Road", "B15 2LN", "F", 2, 195000, "2025-10-22", "edgbaston", { tenure: "L" }),
  makeRecord("sp-124", "17 Portland Road", "B16 9HN", "D", 4, 525000, "2025-09-18", "edgbaston", { vsAsking: -2 }),
  makeRecord("sp-125", "41 George Road", "B15 1PL", "S", 3, 380000, "2025-08-24", "edgbaston"),
  makeRecord("sp-126", "9 Carpenter Road", "B15 2JJ", "T", 2, 245000, "2025-07-16", "edgbaston", { vsAsking: 1 }),
  makeRecord("sp-127", "6 Edgbaston Road", "B12 9QA", "D", 5, 720000, "2025-06-28", "edgbaston", { vsAsking: -4 }),
  makeRecord("sp-128", "28 Church Road", "B15 3SJ", "F", 1, 165000, "2025-05-10", "edgbaston", { tenure: "L" }),
  makeRecord("sp-129", "11 Westbourne Road", "B15 3TR", "S", 3, 365000, "2025-04-22", "edgbaston", { vsAsking: -1 }),
];

const leith: SoldPriceRecord[] = [
  makeRecord("sp-140", "14 The Shore", "EH6 6QW", "F", 2, 285000, "2026-02-08", "leith", { vsAsking: -1 }),
  makeRecord("sp-141", "8 Constitution Street", "EH6 7BT", "F", 1, 195000, "2025-12-15", "leith", { vsAsking: -2 }),
  makeRecord("sp-142", "22 Leith Walk", "EH6 5AA", "T", 3, 365000, "2025-11-20", "leith"),
  makeRecord("sp-143", "5 Bonnington Road", "EH6 5BP", "F", 2, 245000, "2025-10-12", "leith", { vsAsking: 1 }),
  makeRecord("sp-144", "31 Easter Road", "EH6 8LE", "T", 2, 290000, "2025-09-28", "leith", { vsAsking: -1 }),
  makeRecord("sp-145", "9 Commercial Street", "EH6 6LB", "F", 3, 385000, "2025-08-18", "leith", { oldNew: "Y" }),
  makeRecord("sp-146", "15 Great Junction Street", "EH6 5LA", "T", 3, 340000, "2025-07-24", "leith", { vsAsking: -2 }),
  makeRecord("sp-147", "3 Henderson Street", "EH6 6BS", "F", 1, 210000, "2025-06-15", "leith"),
  makeRecord("sp-148", "41 Ferry Road", "EH6 4AD", "S", 4, 425000, "2025-05-22", "leith", { vsAsking: -3 }),
  makeRecord("sp-149", "7 Bernard Street", "EH6 6PP", "F", 2, 265000, "2025-04-10", "leith", { vsAsking: -1 }),
];

const jericho: SoldPriceRecord[] = [
  makeRecord("sp-160", "14 Walton Street", "OX2 6AA", "T", 3, 685000, "2026-01-18", "jericho", { vsAsking: -2 }),
  makeRecord("sp-161", "8 Great Clarendon Street", "OX2 6AT", "T", 2, 525000, "2025-12-05", "jericho", { vsAsking: -1 }),
  makeRecord("sp-162", "22 Canal Street", "OX2 6BQ", "F", 2, 385000, "2025-11-15", "jericho", { tenure: "L" }),
  makeRecord("sp-163", "5 Cardigan Street", "OX2 6BP", "T", 4, 825000, "2025-10-28", "jericho", { vsAsking: -3 }),
  makeRecord("sp-164", "31 Hart Street", "OX2 6BN", "T", 3, 640000, "2025-09-12", "jericho"),
  makeRecord("sp-165", "9 Nelson Street", "OX2 6AU", "T", 2, 495000, "2025-08-20", "jericho", { vsAsking: -1 }),
  makeRecord("sp-166", "15 Albert Street", "OX2 6AY", "S", 3, 580000, "2025-07-15", "jericho", { vsAsking: -2 }),
  makeRecord("sp-167", "3 Observatory Street", "OX2 6EP", "F", 1, 325000, "2025-06-08", "jericho", { tenure: "L" }),
  makeRecord("sp-168", "41 Jericho Street", "OX2 6BU", "T", 3, 610000, "2025-05-24", "jericho", { vsAsking: 1 }),
  makeRecord("sp-169", "7 Cranham Street", "OX2 6DD", "T", 2, 475000, "2025-04-14", "jericho"),
];

const roundhay: SoldPriceRecord[] = [
  makeRecord("sp-180", "14 Princes Avenue", "LS8 2ET", "D", 5, 525000, "2026-02-02", "roundhay", { vsAsking: -3 }),
  makeRecord("sp-181", "8 Park Avenue", "LS8 2JH", "S", 4, 415000, "2025-12-14", "roundhay", { vsAsking: -2 }),
  makeRecord("sp-182", "22 Oakwood Lane", "LS8 2PE", "T", 3, 295000, "2025-11-18", "roundhay", { vsAsking: 1 }),
  makeRecord("sp-183", "5 Lidgett Lane", "LS8 1QT", "D", 4, 465000, "2025-10-25", "roundhay"),
  makeRecord("sp-184", "31 Street Lane", "LS8 2ET", "S", 3, 345000, "2025-09-08", "roundhay", { vsAsking: -1 }),
  makeRecord("sp-185", "9 Wetherby Road", "LS8 2JU", "D", 5, 580000, "2025-08-15", "roundhay", { vsAsking: -4 }),
  makeRecord("sp-186", "15 Elmete Lane", "LS8 2LQ", "T", 3, 275000, "2025-07-22", "roundhay"),
  makeRecord("sp-187", "3 Gledhow Lane", "LS8 1NE", "S", 3, 325000, "2025-06-18", "roundhay", { vsAsking: -1 }),
  makeRecord("sp-188", "41 Old Park Road", "LS8 1JB", "T", 2, 225000, "2025-05-12", "roundhay", { vsAsking: 1 }),
  makeRecord("sp-189", "7 North Park Avenue", "LS8 1JD", "D", 4, 485000, "2025-04-28", "roundhay", { vsAsking: -2 }),
];

const redland: SoldPriceRecord[] = [
  makeRecord("sp-200", "14 Redland Road", "BS6 6QT", "T", 3, 485000, "2026-01-12", "redland", { vsAsking: -1 }),
  makeRecord("sp-201", "8 Hampton Road", "BS6 6HT", "S", 4, 595000, "2025-12-22", "redland", { vsAsking: -2 }),
  makeRecord("sp-202", "22 Zetland Road", "BS6 7AH", "T", 3, 465000, "2025-11-08", "redland"),
  makeRecord("sp-203", "5 Chandos Road", "BS6 6PE", "F", 2, 315000, "2025-10-15", "redland", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-204", "31 Collingwood Road", "BS6 6PA", "T", 4, 545000, "2025-09-20", "redland", { vsAsking: 1 }),
  makeRecord("sp-205", "9 Berkeley Road", "BS6 7LU", "S", 3, 485000, "2025-08-28", "redland", { vsAsking: -2 }),
  makeRecord("sp-206", "15 Kersteman Road", "BS6 7BT", "T", 3, 440000, "2025-07-14", "redland"),
  makeRecord("sp-207", "3 Cranbrook Road", "BS6 7BP", "D", 5, 785000, "2025-06-22", "redland", { vsAsking: -3 }),
  makeRecord("sp-208", "41 Etloe Road", "BS6 7BY", "T", 2, 365000, "2025-05-18", "redland", { vsAsking: -1 }),
  makeRecord("sp-209", "7 Westbury Park", "BS6 7JD", "S", 3, 515000, "2025-04-08", "redland"),
];

const didsbury: SoldPriceRecord[] = [
  makeRecord("sp-220", "14 Wilmslow Road", "M20 6UR", "S", 4, 485000, "2026-02-08", "didsbury", { vsAsking: -2 }),
  makeRecord("sp-221", "8 School Lane", "M20 6RD", "T", 3, 365000, "2025-12-15", "didsbury", { vsAsking: -1 }),
  makeRecord("sp-222", "22 Lapwing Lane", "M20 2NS", "S", 3, 425000, "2025-11-22", "didsbury"),
  makeRecord("sp-223", "5 Palatine Road", "M20 3JL", "D", 5, 685000, "2025-10-18", "didsbury", { vsAsking: -4 }),
  makeRecord("sp-224", "31 Burton Road", "M20 1HB", "T", 2, 285000, "2025-09-12", "didsbury", { vsAsking: 1 }),
  makeRecord("sp-225", "9 Elm Grove", "M20 6RL", "S", 3, 395000, "2025-08-22", "didsbury", { vsAsking: -1 }),
  makeRecord("sp-226", "15 Dene Road", "M20 2GQ", "T", 3, 345000, "2025-07-18", "didsbury"),
  makeRecord("sp-227", "3 Barlow Moor Road", "M20 6TR", "F", 2, 225000, "2025-06-25", "didsbury", { tenure: "L", vsAsking: -2 }),
  makeRecord("sp-228", "41 Stenner Lane", "M20 2RP", "D", 4, 545000, "2025-05-14", "didsbury", { vsAsking: -2 }),
  makeRecord("sp-229", "7 Kingsway", "M20 5PB", "F", 1, 185000, "2025-04-20", "didsbury", { tenure: "L" }),
];

const balticTriangle: SoldPriceRecord[] = [
  makeRecord("sp-240", "14 Jamaica Street", "L1 0AF", "F", 2, 195000, "2026-01-28", "baltic-triangle", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-241", "8 Norfolk Street", "L1 0BE", "F", 1, 145000, "2025-12-18", "baltic-triangle", { tenure: "L" }),
  makeRecord("sp-242", "22 Parliament Street", "L8 5RN", "F", 2, 175000, "2025-11-12", "baltic-triangle", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-243", "5 Greenland Street", "L1 0BS", "F", 1, 158000, "2025-10-22", "baltic-triangle", { tenure: "L", oldNew: "Y" }),
  makeRecord("sp-244", "31 Watkinson Street", "L1 0AJ", "F", 2, 185000, "2025-09-15", "baltic-triangle", { tenure: "L", vsAsking: 2 }),
  makeRecord("sp-245", "9 Bridgewater Street", "L1 0AR", "F", 1, 142000, "2025-08-28", "baltic-triangle", { tenure: "L" }),
  makeRecord("sp-246", "15 Stanhope Street", "L8 5RE", "T", 3, 225000, "2025-07-14", "baltic-triangle", { vsAsking: -2 }),
  makeRecord("sp-247", "3 New Bird Street", "L1 0JD", "F", 2, 198000, "2025-06-20", "baltic-triangle", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-248", "41 Hill Street", "L8 5SB", "T", 2, 195000, "2025-05-18", "baltic-triangle"),
  makeRecord("sp-249", "7 Blundell Street", "L1 0AJ", "F", 1, 155000, "2025-04-12", "baltic-triangle", { tenure: "L", vsAsking: -1 }),
];

const westEnd: SoldPriceRecord[] = [
  makeRecord("sp-260", "14 Byres Road", "G12 8AP", "F", 2, 225000, "2026-02-05", "west-end", { vsAsking: -1 }),
  makeRecord("sp-261", "8 Great Western Road", "G12 8HN", "T", 3, 315000, "2025-12-20", "west-end", { vsAsking: -2 }),
  makeRecord("sp-262", "22 Hyndland Road", "G12 9UX", "F", 3, 295000, "2025-11-15", "west-end"),
  makeRecord("sp-263", "5 Ashton Lane", "G12 8SJ", "F", 1, 165000, "2025-10-28", "west-end", { vsAsking: -1 }),
  makeRecord("sp-264", "31 Kelvin Drive", "G20 8QH", "T", 4, 385000, "2025-09-14", "west-end", { vsAsking: -3 }),
  makeRecord("sp-265", "9 Hillhead Street", "G12 8PZ", "F", 2, 215000, "2025-08-22", "west-end"),
  makeRecord("sp-266", "15 Gibson Street", "G12 8NU", "T", 2, 255000, "2025-07-18", "west-end", { vsAsking: -1 }),
  makeRecord("sp-267", "3 University Avenue", "G12 8QQ", "F", 1, 175000, "2025-06-12", "west-end"),
  makeRecord("sp-268", "41 Partick Bridge Street", "G11 6PN", "T", 3, 285000, "2025-05-20", "west-end", { vsAsking: 1 }),
  makeRecord("sp-269", "7 Ruthven Lane", "G12 9BG", "F", 2, 235000, "2025-04-15", "west-end", { vsAsking: -2 }),
];

const hockley: SoldPriceRecord[] = [
  makeRecord("sp-280", "14 Goose Gate", "NG1 1FF", "F", 2, 185000, "2026-01-22", "hockley", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-281", "8 Broad Street", "NG1 3AL", "F", 1, 145000, "2025-12-10", "hockley", { tenure: "L" }),
  makeRecord("sp-282", "22 Stoney Street", "NG1 1LG", "F", 2, 195000, "2025-11-18", "hockley", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-283", "5 Carlton Street", "NG1 1NL", "T", 3, 245000, "2025-10-22", "hockley", { vsAsking: -2 }),
  makeRecord("sp-284", "31 Heathcoat Street", "NG1 3AF", "F", 1, 155000, "2025-09-15", "hockley", { tenure: "L" }),
  makeRecord("sp-285", "9 Woolpack Lane", "NG1 1GA", "F", 2, 178000, "2025-08-20", "hockley", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-286", "15 Barker Gate", "NG1 1JU", "T", 2, 215000, "2025-07-12", "hockley"),
  makeRecord("sp-287", "3 Broadway", "NG1 1PR", "F", 1, 138000, "2025-06-22", "hockley", { tenure: "L" }),
  makeRecord("sp-288", "41 Sneinton Market", "NG1 1EF", "F", 2, 175000, "2025-05-18", "hockley", { tenure: "L", vsAsking: -2 }),
  makeRecord("sp-289", "7 George Street", "NG1 3BE", "T", 3, 235000, "2025-04-14", "hockley", { vsAsking: 1 }),
];

const kelhamIsland: SoldPriceRecord[] = [
  makeRecord("sp-300", "14 Kelham Island", "S3 8RY", "F", 2, 195000, "2026-02-10", "kelham-island", { tenure: "L", oldNew: "Y", vsAsking: 1 }),
  makeRecord("sp-301", "8 Green Lane", "S3 8SJ", "F", 1, 148000, "2025-12-15", "kelham-island", { tenure: "L" }),
  makeRecord("sp-302", "22 Alma Street", "S3 8SA", "F", 2, 185000, "2025-11-22", "kelham-island", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-303", "5 Corporation Street", "S3 8RW", "T", 3, 265000, "2025-10-18", "kelham-island", { vsAsking: -2 }),
  makeRecord("sp-304", "31 Burton Road", "S3 8BX", "F", 1, 155000, "2025-09-25", "kelham-island", { tenure: "L", oldNew: "Y" }),
  makeRecord("sp-305", "9 Russell Street", "S3 8EH", "T", 2, 225000, "2025-08-14", "kelham-island"),
  makeRecord("sp-306", "15 Mowbray Street", "S3 8EN", "F", 2, 198000, "2025-07-20", "kelham-island", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-307", "3 Ball Street", "S3 8DB", "F", 1, 142000, "2025-06-28", "kelham-island", { tenure: "L" }),
  makeRecord("sp-308", "41 Neepsend Lane", "S3 8AT", "T", 3, 245000, "2025-05-15", "kelham-island", { vsAsking: 1 }),
  makeRecord("sp-309", "7 Boiler House Road", "S3 8QU", "F", 2, 208000, "2025-04-18", "kelham-island", { tenure: "L", oldNew: "Y", vsAsking: -2 }),
];

const brixton: SoldPriceRecord[] = [
  makeRecord("sp-320", "14 Coldharbour Lane", "SW9 8PR", "T", 3, 685000, "2026-01-15", "brixton", { vsAsking: -2 }),
  makeRecord("sp-321", "8 Acre Lane", "SW2 5SG", "F", 2, 425000, "2025-12-08", "brixton", { tenure: "L", vsAsking: -1 }),
  makeRecord("sp-322", "22 Brixton Hill", "SW2 1HF", "T", 4, 795000, "2025-11-20", "brixton", { vsAsking: -3 }),
  makeRecord("sp-323", "5 Electric Avenue", "SW9 8JP", "F", 1, 345000, "2025-10-14", "brixton", { tenure: "L" }),
  makeRecord("sp-324", "31 Railton Road", "SE24 0LR", "T", 3, 650000, "2025-09-22", "brixton", { vsAsking: -2 }),
  makeRecord("sp-325", "9 Dulwich Road", "SE24 0PA", "S", 4, 885000, "2025-08-18", "brixton", { vsAsking: -4 }),
  makeRecord("sp-326", "15 Effra Road", "SW2 1BZ", "T", 3, 720000, "2025-07-25", "brixton", { vsAsking: -1 }),
  makeRecord("sp-327", "3 Loughborough Road", "SW9 7TB", "F", 2, 395000, "2025-06-12", "brixton", { tenure: "L" }),
  makeRecord("sp-328", "41 Tulse Hill", "SW2 2TJ", "S", 3, 625000, "2025-05-20", "brixton", { vsAsking: 1 }),
  makeRecord("sp-329", "7 Stockwell Road", "SW9 9AU", "T", 2, 545000, "2025-04-15", "brixton", { vsAsking: -2 }),
];

const newnham: SoldPriceRecord[] = [
  makeRecord("sp-340", "14 Grantchester Road", "CB3 9ED", "D", 4, 895000, "2026-01-20", "newnham", { vsAsking: -3 }),
  makeRecord("sp-341", "8 Barton Road", "CB3 9LG", "S", 3, 625000, "2025-12-10", "newnham", { vsAsking: -2 }),
  makeRecord("sp-342", "22 Newnham Road", "CB3 9EY", "T", 3, 545000, "2025-11-15", "newnham"),
  makeRecord("sp-343", "5 Sidgwick Avenue", "CB3 9DA", "D", 5, 1150000, "2025-10-22", "newnham", { vsAsking: -4 }),
  makeRecord("sp-344", "31 Millington Road", "CB3 9HP", "S", 3, 585000, "2025-09-18", "newnham", { vsAsking: -1 }),
  makeRecord("sp-345", "9 Owlstone Road", "CB3 9JQ", "T", 2, 445000, "2025-08-25", "newnham"),
  makeRecord("sp-346", "15 Grange Road", "CB3 9AS", "D", 4, 825000, "2025-07-14", "newnham", { vsAsking: -3 }),
  makeRecord("sp-347", "3 Selwyn Road", "CB3 9EA", "T", 3, 565000, "2025-06-20", "newnham", { vsAsking: -1 }),
  makeRecord("sp-348", "41 Lammas Land", "CB3 9EX", "S", 3, 595000, "2025-05-12", "newnham", { vsAsking: -2 }),
  makeRecord("sp-349", "7 Fen Causeway", "CB1 2DQ", "F", 2, 385000, "2025-04-18", "newnham", { tenure: "L" }),
];

export const SOLD_PRICES: Record<string, SoldPriceRecord[]> = {
  isleworth, islington, camden, headingley, clifton, ancoats, edgbaston, leith,
  jericho, roundhay, redland, didsbury, "baltic-triangle": balticTriangle,
  "west-end": westEnd, hockley, "kelham-island": kelhamIsland, brixton, newnham,
};

// --- Individual property detail pages ---
export const SOLD_PRICE_DETAILS: Record<string, SoldPriceDetail> = {
  "14-south-street-tw7-7bg": {
    address: "14 South Street, Isleworth", postcode: "TW7 7BG", propertyType: "Terraced House",
    lastPrice: 485000, lastDate: "January 2026", growth: "+48% since 2015",
    estimatedValue: "£512,000",
    coordinates: { lat: 51.4685, lng: -0.3374 },
    history: [
      { price: 485000, date: "Jan 2026", change: "+12.8%" },
      { price: 430000, date: "Mar 2021", change: "+34.4%" },
      { price: 320000, date: "Jun 2015", change: "+28.0%" },
      { price: 250000, date: "Sep 2009", change: "+47.1%" },
      { price: 170000, date: "Apr 2002", change: null },
    ],
    nearby: [
      { address: "16 South Street", price: "£475,000", date: "Nov 2025", slug: "16-south-street-tw7-7bg" },
      { address: "7 Bridge Road", price: "£625,000", date: "Dec 2025", slug: "7-bridge-road-tw7-6ba" },
      { address: "42 Church Street", price: "£345,000", date: "Nov 2025", slug: "42-church-street-tw7-6be" },
      { address: "91 London Road", price: "£510,000", date: "Oct 2025", slug: "91-london-road-tw7-5bj" },
    ],
    areaSlug: "isleworth", areaName: "Isleworth", areaGrowth: "+3.2% this year",
  },
  "14-canonbury-square-n1-2al": {
    address: "14 Canonbury Square, Islington", postcode: "N1 2AL", propertyType: "Terraced House",
    lastPrice: 1450000, lastDate: "February 2026", growth: "+52% since 2015",
    estimatedValue: "£1,520,000",
    coordinates: { lat: 51.5443, lng: -0.0972 },
    history: [
      { price: 1450000, date: "Feb 2026", change: "+9.4%" },
      { price: 1325000, date: "Jul 2021", change: "+38.9%" },
      { price: 954000, date: "Mar 2015", change: "+35.6%" },
      { price: 703000, date: "Nov 2008", change: "+54.8%" },
      { price: 454000, date: "May 2001", change: null },
    ],
    nearby: [
      { address: "16 Canonbury Square", price: "£1,380,000", date: "Dec 2025", slug: "16-canonbury-square-n1-2al" },
      { address: "8 Upper Street", price: "£625,000", date: "Jan 2026", slug: "8-upper-street-n1-0pq" },
      { address: "31 Barnsbury Road", price: "£1,280,000", date: "Dec 2025", slug: "31-barnsbury-road-n1-0es" },
      { address: "72 Essex Road", price: "£1,150,000", date: "Oct 2025", slug: "72-essex-road-n1-8lt" },
    ],
    areaSlug: "islington", areaName: "Islington", areaGrowth: "+4.1% this year",
  },
  "14-headingley-lane-ls6-1bl": {
    address: "14 Headingley Lane, Leeds", postcode: "LS6 1BL", propertyType: "Terraced House",
    lastPrice: 285000, lastDate: "February 2026", growth: "+68% since 2015",
    estimatedValue: "£295,000",
    coordinates: { lat: 53.8252, lng: -1.5763 },
    history: [
      { price: 285000, date: "Feb 2026", change: "+18.8%" },
      { price: 240000, date: "May 2021", change: "+41.2%" },
      { price: 170000, date: "Aug 2015", change: "+30.8%" },
      { price: 130000, date: "Jan 2010", change: "+44.4%" },
      { price: 90000, date: "Jun 2002", change: null },
    ],
    nearby: [
      { address: "8 Cardigan Road", price: "£340,000", date: "Dec 2025", slug: "8-cardigan-road-ls6-3ag" },
      { address: "22 St Michael's Lane", price: "£310,000", date: "Nov 2025", slug: "22-st-michaels-lane-ls6-3br" },
      { address: "5 Victoria Road", price: "£225,000", date: "Oct 2025", slug: "5-victoria-road-ls6-1dr" },
      { address: "31 Ash Road", price: "£265,000", date: "Sep 2025", slug: "31-ash-road-ls6-3hd" },
    ],
    areaSlug: "headingley", areaName: "Headingley", areaGrowth: "+5.1% this year",
  },
  "8-royal-york-crescent-bs8-4jz": {
    address: "8 Royal York Crescent, Clifton", postcode: "BS8 4JZ", propertyType: "Terraced House",
    lastPrice: 850000, lastDate: "January 2026", growth: "+45% since 2015",
    estimatedValue: "£885,000",
    coordinates: { lat: 51.4534, lng: -2.6239 },
    history: [
      { price: 850000, date: "Jan 2026", change: "+13.3%" },
      { price: 750000, date: "Apr 2021", change: "+36.4%" },
      { price: 550000, date: "Sep 2015", change: "+25.7%" },
      { price: 437500, date: "Mar 2009", change: "+40.0%" },
      { price: 312500, date: "Jul 2001", change: null },
    ],
    nearby: [
      { address: "15 Clifton Park Road", price: "£625,000", date: "Dec 2025", slug: "15-clifton-park-road-bs8-3hn" },
      { address: "3 Sion Hill", price: "£385,000", date: "Nov 2025", slug: "3-sion-hill-bs8-4bb" },
      { address: "22 Pembroke Road", price: "£580,000", date: "Oct 2025", slug: "22-pembroke-road-bs8-3ba" },
      { address: "41 Whiteladies Road", price: "£295,000", date: "Sep 2025", slug: "41-whiteladies-road-bs8-2ly" },
    ],
    areaSlug: "clifton", areaName: "Clifton", areaGrowth: "+4.2% this year",
  },
  "14-cutting-room-square-m4-6eg": {
    address: "14 Cutting Room Square, Ancoats", postcode: "M4 6EG", propertyType: "Flat",
    lastPrice: 285000, lastDate: "February 2026", growth: "+62% since 2018",
    estimatedValue: "£298,000",
    coordinates: { lat: 53.4848, lng: -2.2273 },
    history: [
      { price: 285000, date: "Feb 2026", change: "+14.0%" },
      { price: 250000, date: "Aug 2022", change: "+42.0%" },
      { price: 176000, date: "Mar 2018", change: null },
    ],
    nearby: [
      { address: "8 Jersey Street", price: "£215,000", date: "Dec 2025", slug: "8-jersey-street-m4-6ja" },
      { address: "31 Bengal Street", price: "£265,000", date: "Nov 2025", slug: "31-bengal-street-m4-6aq" },
      { address: "5 Blossom Street", price: "£198,000", date: "Oct 2025", slug: "5-blossom-street-m4-6aj" },
      { address: "22 Pollard Street", price: "£325,000", date: "Sep 2025", slug: "22-pollard-street-m4-7hp" },
    ],
    areaSlug: "ancoats", areaName: "Ancoats", areaGrowth: "+7.2% this year",
  },
  "14-the-shore-eh6-6qw": {
    address: "14 The Shore, Leith", postcode: "EH6 6QW", propertyType: "Flat",
    lastPrice: 285000, lastDate: "February 2026", growth: "+55% since 2016",
    estimatedValue: "£296,000",
    coordinates: { lat: 55.9745, lng: -3.1718 },
    history: [
      { price: 285000, date: "Feb 2026", change: "+11.8%" },
      { price: 255000, date: "Jun 2021", change: "+38.0%" },
      { price: 184750, date: "Oct 2016", change: "+32.5%" },
      { price: 139500, date: "Apr 2010", change: null },
    ],
    nearby: [
      { address: "8 Constitution Street", price: "£195,000", date: "Dec 2025", slug: "8-constitution-street-eh6-7bt" },
      { address: "22 Leith Walk", price: "£365,000", date: "Nov 2025", slug: "22-leith-walk-eh6-5aa" },
      { address: "5 Bonnington Road", price: "£245,000", date: "Oct 2025", slug: "5-bonnington-road-eh6-5bp" },
      { address: "31 Easter Road", price: "£290,000", date: "Sep 2025", slug: "31-easter-road-eh6-8le" },
    ],
    areaSlug: "leith", areaName: "Leith", areaGrowth: "+3.8% this year",
  },
  "14-walton-street-ox2-6aa": {
    address: "14 Walton Street, Jericho", postcode: "OX2 6AA", propertyType: "Terraced House",
    lastPrice: 685000, lastDate: "January 2026", growth: "+41% since 2015",
    estimatedValue: "£715,000",
    coordinates: { lat: 51.7611, lng: -1.2671 },
    history: [
      { price: 685000, date: "Jan 2026", change: "+10.5%" },
      { price: 620000, date: "Sep 2021", change: "+27.8%" },
      { price: 485000, date: "Feb 2015", change: "+29.3%" },
      { price: 375000, date: "Aug 2008", change: "+50.0%" },
      { price: 250000, date: "Mar 2001", change: null },
    ],
    nearby: [
      { address: "8 Great Clarendon Street", price: "£525,000", date: "Dec 2025", slug: "8-great-clarendon-street-ox2-6at" },
      { address: "22 Canal Street", price: "£385,000", date: "Nov 2025", slug: "22-canal-street-ox2-6bq" },
      { address: "5 Cardigan Street", price: "£825,000", date: "Oct 2025", slug: "5-cardigan-street-ox2-6bp" },
      { address: "31 Hart Street", price: "£640,000", date: "Sep 2025", slug: "31-hart-street-ox2-6bn" },
    ],
    areaSlug: "jericho", areaName: "Jericho", areaGrowth: "+3.4% this year",
  },
  "14-jamaica-street-l1-0af": {
    address: "14 Jamaica Street, Baltic Triangle", postcode: "L1 0AF", propertyType: "Flat",
    lastPrice: 195000, lastDate: "January 2026", growth: "+73% since 2018",
    estimatedValue: "£205,000",
    coordinates: { lat: 53.3953, lng: -2.9849 },
    history: [
      { price: 195000, date: "Jan 2026", change: "+18.2%" },
      { price: 165000, date: "Mar 2022", change: "+46.0%" },
      { price: 113000, date: "Sep 2018", change: null },
    ],
    nearby: [
      { address: "8 Norfolk Street", price: "£145,000", date: "Dec 2025", slug: "8-norfolk-street-l1-0be" },
      { address: "22 Parliament Street", price: "£175,000", date: "Nov 2025", slug: "22-parliament-street-l8-5rn" },
      { address: "5 Greenland Street", price: "£158,000", date: "Oct 2025", slug: "5-greenland-street-l1-0bs" },
      { address: "31 Watkinson Street", price: "£185,000", date: "Sep 2025", slug: "31-watkinson-street-l1-0aj" },
    ],
    areaSlug: "baltic-triangle", areaName: "Baltic Triangle", areaGrowth: "+6.1% this year",
  },
};

// --- Helper functions ---
export function getSoldPricesForArea(areaSlug: string): SoldPriceRecord[] {
  return SOLD_PRICES[areaSlug] ?? [];
}

export function getSoldPriceDetail(slug: string): SoldPriceDetail | null {
  return SOLD_PRICE_DETAILS[slug] ?? null;
}

export function getAreaSoldPriceSummary(areaSlug: string): {
  avgPrice: number;
  totalTransactions: number;
  yoyChange: number;
  avgVsAsking: number;
} {
  const records = SOLD_PRICES[areaSlug] ?? [];
  if (records.length === 0) {
    return { avgPrice: 0, totalTransactions: 0, yoyChange: 0, avgVsAsking: 0 };
  }
  const total = records.reduce((sum, r) => sum + r.price, 0);
  const avgPrice = Math.round(total / records.length);
  const askingRecords = records.filter(r => r.vsAsking !== null);
  const avgVsAsking = askingRecords.length > 0
    ? Math.round((askingRecords.reduce((s, r) => s + (r.vsAsking ?? 0), 0) / askingRecords.length) * 10) / 10
    : 0;
  return { avgPrice, totalTransactions: records.length, yoyChange: 3.2, avgVsAsking };
}

/** All area slugs that have sold price data */
export function getAreaSlugsWithSoldPrices(): string[] {
  return Object.keys(SOLD_PRICES);
}
