import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";

// Functions array will be populated as Inngest functions are created in later plans
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
});
