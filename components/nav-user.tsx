"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconHome,
  IconLogin,
  IconLogout,
  IconNotification,
  IconTruckReturn,
  IconUserCircle,
} from "@tabler/icons-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "./providers/auth-provider"
import Image from "next/image"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user: authUser, profile, role, loading, logout } = useAuth()

  // Loading state — skeleton
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="bg-muted h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <div className="bg-muted h-3.5 w-24 rounded" />
              <div className="bg-muted h-2.5 w-32 rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Guest state — not logged in
  if (!authUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/login" className="gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="bg-muted rounded-lg">
                  <IconUserCircle className="text-muted-foreground size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Guest</span>
                <span className="text-muted-foreground truncate text-xs">
                  Sign in to your account
                </span>
              </div>
              <IconLogin className="text-muted-foreground ml-auto size-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Authenticated state
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Home">
          <Link href="/">
            <Image width={20} height={20} src="/icons/back.png" alt="Home" />
            <span>Return Home</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || authUser?.email || "User"} />
                <AvatarFallback className="rounded-lg">
                  {profile?.full_name?.substring(0, 2)?.toUpperCase() || authUser?.email?.substring(0, 2)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile?.full_name || "User"}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {authUser?.email} • <span className="capitalize">{role || "User"}</span>
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || authUser?.email || "User"} />
                  <AvatarFallback className="rounded-lg">
                    {profile?.full_name?.substring(0, 2)?.toUpperCase() || authUser?.email?.substring(0, 2)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile?.full_name || "User"}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {authUser?.email} • <span className="capitalize">{role || "User"}</span>
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

