
"use client";

import { SharedLayout } from "@/components/shared-layout";
import { useInstitution } from "@/context/institution-context";
import { ClipboardCheck, Bed, LogOut } from "lucide-react";
import React from "react";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { institution } = useInstitution();
  const navItems = [
    { href: "/assistant/roll-call", label: "Absensi Apel", icon: ClipboardCheck },
    { href: "/assistant/report-sick", label: "Lapor Sakit", icon: Bed },
    { href: "/assistant/permit-leave", label: "Catat Izin", icon: LogOut },
  ];

  return <SharedLayout navItems={navItems}>{children}</SharedLayout>;
}
