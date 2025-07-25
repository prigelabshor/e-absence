"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { LogOut, ChevronRight } from "lucide-react";
import Image from "next/image";

interface SharedLayoutProps {
  navItems: {
    href: string;
    label: string;
    icon: LucideIcon;
  }[];
  children: React.ReactNode;
}

export function SharedLayout({ navItems, children }: SharedLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r bg-card">
          <SidebarHeader className="px-2 py-3 border-b">
            <div className="flex items-center gap-3">
              {/* Replaced GraduationCap with your logo.png */}
              <Image
                src="/logo.png"
                alt="Logo"
                width={60}
                height={60}
                className="w-15 h-15 rounded-full object-cover"
              />
              <h2 className="text-lg font-semibold tracking-tight">Class Attendant</h2>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="group transition-colors"
                  >
                    <Link 
                      href={item.href}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-white group-[&[data-active=true]]:text-white" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Link 
                    href="/"
                    className="flex items-center gap-3"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/70 backdrop-blur px-4">
            <SidebarTrigger className="lg:hidden" />
            {/* Future user menu */}
          </header>
          
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}