"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar, IconCircle,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconTags,
  IconUsers,
  IconPhoto,
  IconTicket
} from "@tabler/icons-react";

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
import { useAuth } from "./providers/auth-provider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useAuth();

  const navItems = role === "admin"
    ? [
        { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
        { title: "Users", url: "/dashboard/users", icon: IconUsers },
        { title: "Roles", url: "/dashboard/roles", icon: IconListDetails },
        { title: "Categories", url: "/dashboard/categories", icon: IconTags },
        { title: "Products", url: "/dashboard/products", icon: IconFolder },
        { title: "Orders", url: "/dashboard/orders", icon: IconListDetails },
        { title: "Coupons", url: "/dashboard/coupons", icon: IconTicket },
        { title: "Banners", url: "/dashboard/promo-banners", icon: IconPhoto },
      ]
    : [
        { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
        { title: "Products", url: "/dashboard/products", icon: IconFolder },
      ];

  const data = {
    user: {
      name: "Toby Belhome",
      email: "m@example.com",
      avatar: "https://www.tobybelhome.com/toby-belhome.png",
    },
    navSecondary: [
      {
        title: "Get Pro",
        url: "https://shadcnuikit.com/pricing",
        icon: IconCircle,
      },
      {
        title: "Shadcn UI Kit",
        url: "https://shadcnuikit.com/",
        icon: IconCircle,
      },
      {
        title: "Bundui Component",
        url: "https://bundui.io",
        icon: IconCircle,
      },
    ],
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img src="https://shadcnuikit.com/logo.png" className="size-6 rounded-sm group-data-[collapsible=icon]:size-5" alt="shadcn ui kit svg logo" />
                <span className="text-base font-medium">Shadcn UI Kit</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
