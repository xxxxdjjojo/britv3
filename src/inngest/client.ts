import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "britestate",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
