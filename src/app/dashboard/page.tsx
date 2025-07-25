
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInstitution } from "@/context/institution-context";
import { BookOpenCheck, Loader2, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getClasses } from "@/lib/firestore-service";
import type { Class } from "@/lib/types";

export default function DashboardPage() {
  const { institution } = useInstitution();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const I18N = institution === 'formal'
    ? {
        title: "Dashboard Guru",
        desc: "Pilih kelas untuk mengelola absensi.",
        searchPlaceholder: "Cari kelas...",
        cardDesc: "Tingkat",
        cardContent: "Kelola absensi untuk siswa di kelas ini.",
        btn: "Isi Absensi",
        noClass: "Belum ada kelas yang dibuat. Silakan hubungi admin.",
        noSearchResult: "Kelas tidak ditemukan."
      }
    : {
        title: "Dashboard Guru KurPes",
        desc: "Pilih program untuk mengelola absensi.",
        searchPlaceholder: "Cari program...",
        cardDesc: "Program",
        cardContent: "Kelola absensi untuk santri pada program ini.",
        btn: "Isi Absensi",
        noClass: "Belum ada program yang dibuat. Silakan hubungi admin.",
        noSearchResult: "Program tidak ditemukan."
      };
      
  useEffect(() => {
    setIsLoading(true);
    getClasses(institution)
      .then(data => {
        setClasses(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch classes:", error);
        setIsLoading(false);
      });
  }, [institution]);

  const filteredClasses = useMemo(() => {
    if (!searchTerm) {
      return classes;
    }
    return classes.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classes, searchTerm]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      );
    }
    if (classes.length === 0) {
      return (
        <Card className="text-center p-8">
          <CardTitle>Data Kosong</CardTitle>
          <CardDescription>{I18N.noClass}</CardDescription>
        </Card>
      );
    }
    if (filteredClasses.length === 0) {
        return (
             <Card className="text-center p-8">
                <CardTitle>{I18N.noSearchResult}</CardTitle>
                <CardDescription>Coba kata kunci lain atau periksa kembali daftar kelas.</CardDescription>
            </Card>
        )
    }
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{c.name}</CardTitle>
              <CardDescription>{I18N.cardDesc} {c.grade}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{I18N.cardContent}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/dashboard/attendance/${c.id}`}>
                  <BookOpenCheck className="mr-2 h-4 w-4" />
                  {I18N.btn}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{I18N.title}</h1>
            <p className="text-muted-foreground">{I18N.desc}</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search"
                placeholder={I18N.searchPlaceholder}
                className="pl-9 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={classes.length === 0}
            />
          </div>
      </div>
      {renderContent()}
    </div>
  );
}

