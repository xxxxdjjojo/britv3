export const PROFANITY_LIST: string[] = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "bugger",
  "bullshit",
  "cock",
  "crap",
  "cunt",
  "damn",
  "dick",
  "dickhead",
  "douche",
  "douchebag",
  "dumbass",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "fuckwit",
  "goddamn",
  "hell",
  "horseshit",
  "idiot",
  "jackass",
  "jerk",
  "moron",
  "motherfucker",
  "nigga",
  "nigger",
  "piss",
  "prick",
  "pussy",
  "retard",
  "shit",
  "shithead",
  "slut",
  "son of a bitch",
  "twat",
  "wanker",
  "whore",
  "arse",
  "arsehole",
  "bellend",
  "knob",
  "knobhead",
  "minge",
  "numpty",
  "pillock",
  "plonker",
  "tosser",
  "turd",
  "wank",
  "bloody",
  "bloke",
  "git",
  "slag",
  "sodding",
  "sod",
  "shag",
  "shagger",
  "shite",
  "spastic",
  "twit",
  "dimwit",
  "halfwit",
  "nitwit",
  "dolt",
  "dope",
  "dunce",
  "fool",
  "imbecile",
  "loon",
  "lout",
  "muppet",
  "oaf",
  "prat",
  "bimbo",
  "tart",
  "skank",
  "hooker",
  "prostitute",
  "tramp",
  "scumbag",
  "scum",
  "vermin",
  "creep",
  "pervert",
  "perv",
  "pedo",
  "paedo",
  "pedophile",
  "rapist",
  "molester",
  "nonce",
  "druggie",
  "junkie",
  "crackhead",
  "drunkard",
  "waster",
  "deadbeat",
  "loser",
  "dirtbag",
  "sleazebag",
  "sleaze",
  "scoundrel",
];

function buildWordPattern(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => buildWordPattern(word).test(lower));
}

export function findProfanity(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const word of PROFANITY_LIST) {
    const pattern = buildWordPattern(word);
    if (pattern.test(lower)) {
      found.add(word.toLowerCase());
    }
  }

  return Array.from(found);
}
