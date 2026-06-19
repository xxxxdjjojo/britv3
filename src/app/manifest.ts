import type { MetadataRoute } from "next";
import { brandConfig } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brandConfig.displayName} - UK Property Portal`,
    short_name: brandConfig.shortName,
    description: `Find, compare, and transact on UK properties with ${brandConfig.displayName}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#005F73",
    icons: [
      {
        src: brandConfig.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandConfig.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandConfig.assets.iconMaskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
