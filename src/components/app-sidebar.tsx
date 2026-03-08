"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  SearchIcon,
  ChartBarIcon,
  Building2Icon,
  UsersIcon,
  WrenchIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  Settings2Icon,
  CircleHelpIcon,
  BriefcaseIcon,
  HomeIcon,
  PoundSterlingIcon,
  MapPinIcon,
  FileTextIcon,
  StarIcon,
} from "lucide-react"

const data = {
  user: {
    name: "James Mitchell",
    email: "james@britestate.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/overview",
      icon: (
        <LayoutDashboardIcon />
      ),
    },
    {
      title: "Properties",
      url: "/search",
      icon: (
        <Building2Icon />
      ),
    },
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: (
        <BriefcaseIcon />
      ),
    },
    {
      title: "Analytics",
      url: "/dashboard",
      icon: (
        <ChartBarIcon />
      ),
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: (
        <UsersIcon />
      ),
    },
  ],
  navClouds: [
    {
      title: "Listings",
      icon: (
        <HomeIcon />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Listings",
          url: "#",
        },
        {
          title: "Pending Review",
          url: "#",
        },
      ],
    },
    {
      title: "Transactions",
      icon: (
        <PoundSterlingIcon />
      ),
      url: "#",
      items: [
        {
          title: "In Progress",
          url: "#",
        },
        {
          title: "Completed",
          url: "#",
        },
      ],
    },
    {
      title: "Providers",
      icon: (
        <WrenchIcon />
      ),
      url: "#",
      items: [
        {
          title: "Verified Providers",
          url: "#",
        },
        {
          title: "Pending Verification",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: (
        <Settings2Icon />
      ),
    },
    {
      title: "Help Centre",
      url: "/help",
      icon: (
        <CircleHelpIcon />
      ),
    },
    {
      title: "Search",
      url: "/search",
      icon: (
        <SearchIcon />
      ),
    },
  ],
  documents: [
    {
      name: "Market Reports",
      url: "#",
      icon: (
        <ChartBarIcon />
      ),
    },
    {
      name: "Reviews & Ratings",
      url: "#",
      icon: (
        <StarIcon />
      ),
    },
    {
      name: "Compliance Docs",
      url: "#",
      icon: (
        <FileTextIcon />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" />}
            >
              <MapPinIcon className="size-5! text-emerald-600" />
              <span className="text-base font-semibold">Britestate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
