
"use client";

import { SharedLayout } from "@/components/shared-layout";
import { useInstitution } from "@/context/institution-context";
import { School, Users, FileText, BookCopy, BookHeart, BedDouble, ClipboardCheck, Bell, Activity } from "lucide-react";
import React from "react";

const navConfig = {
  formal: [
    { href: "/admin/classes", label: "Kelola Kelas", icon: School },
    { href: "/admin/students", label: "Kelola Siswa", icon: Users },
    { href: "/admin/subjects", label: "Kelola Mapel", icon: BookCopy },
    { href: "/admin/dormitories", label: "Kelola Asrama", icon: BedDouble },
    { href: "/admin/rekap", label: "Rekap Absensi Formal", icon: FileText },
    { href: "/admin/rekap-apel", label: "Rekap Kehadiran Apel", icon: ClipboardCheck },
    { href: "/admin/rekap-sakit-pulang", label: "Rekap Sakit & Pulang", icon: Activity },
    { href: "/admin/rekap-halaqah", label: "Rekap Absensi Kurpes", icon: BookHeart },
  ],
  pesantren: [
    { href: "/admin/classes", label: "Kelola Halaqah", icon: BookHeart },
    { href: "/admin/students", label: "Kelola Santri", icon: Users },
    { href: "/admin/subjects", label: "Kelola Kitab", icon: BookCopy },
    { href: "/admin/dormitories", label: "Kelola Asrama", icon: BedDouble },
    { href: "/admin/rekap", label: "Rekap Absensi Halaqah", icon: FileText },
  ],
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { institution } = useInstitution();
  const navItems = navConfig[institution];

  return <SharedLayout navItems={navItems}>{children}</SharedLayout>;
}
