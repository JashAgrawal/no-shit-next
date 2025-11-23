"use client";

import { NavLink } from "@/src/components/NavLink";
import { AGENTS } from "@/src/lib/agents";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Grid3x3,
  Users,
  Lightbulb,
  BarChart3,
  LogOut,
  FolderOpen,
  CheckSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AppSidebar() {
  const { state } = useSidebar();
  const router = useRouter();
  const collapsed = state === "collapsed";

  const mainRoutes = [
    { title: "HiveMind Chat", url: "/dashboard", icon: Grid3x3 },
    { title: "Boardroom", url: "/dashboard/boardroom", icon: Users },
    { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
    // {
    //   title: "All Ideas",
    //   url: "/analyze-ideas",
    //   icon: FolderOpen,
    //   external: true,
    // },
    // { title: "Idea Stats", url: "/dashboard/stats", icon: BarChart3 },
    { title: "Validator", url: "/dashboard/validator", icon: Lightbulb },
  ];

  const agentRoutes = Object.values(AGENTS).map((agent) => ({
    title: agent.name,
    type: ["ceo", "cto", "cmo", "cfo"].includes(agent.id)
      ? agent.id.toUpperCase()
      : agent.id.charAt(0).toUpperCase() + agent.id.slice(1),
    url: `/dashboard/agent/${agent.id}`,
    emoji: agent.emoji,
  }));

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div
          onClick={() => {
            router.push("/");
          }}
          className="p-4 border-b border-border cursor-pointer"
        >
          <h2
            className={`font-mono font-bold text-primary ${
              collapsed ? "text-xs" : "text-lg"
            }`}
          >
            {collapsed ? "NS" : "NO SHIT"}
          </h2>
          {!collapsed && (
            <p className="text-xs font-mono text-muted-foreground">
              HiveMind Active
            </p>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-xs" : ""}>
            {collapsed ? "Main" : "MAIN MENU"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainRoutes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      href={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Agent Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-xs" : ""}>
            {collapsed ? "AI" : "AI AGENTS"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agentRoutes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      href={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <span className="text-lg">{item.emoji}</span>
                      {!collapsed && (
                        <div className="ml-2 flex flex-col text-left">
                          <span className="leading-tight">{item.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase leading-tight">
                            {item.type}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Exit Oracle</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
