import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/landlord/portfolio",
        destination: "/dashboard/landlord/properties",
        permanent: true,
      },
      {
        source: "/dashboard/landlord/rent-collection",
        destination: "/dashboard/landlord/rent",
        permanent: true,
      },
      {
        source: "/dashboard/landlord/finances",
        destination: "/dashboard/landlord/finance/expenses",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
