"use client";

import { SharedLayout } from "@/components/shared-layout";
import { useInstitution } from "@/context/institution-context";
import { LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { institution } = useInstitution();
  
  const navItems = [
    { href: "/dashboard", label: institution === 'formal' ? "Pilih Kelas" : "Pilih Halaqah", icon: LayoutDashboard },
  ];

  return <SharedLayout navItems={navItems}>{children}</SharedLayout>;
}
