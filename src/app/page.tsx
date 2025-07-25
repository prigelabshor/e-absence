"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, UserCog, ClipboardCheck } from "lucide-react";
import { useInstitution } from "@/context/institution-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function LoginPage() {
  const { institution, setInstitution, isLoading } = useInstitution();
  
  const handleLogin = (role: 'teacher' | 'admin' | 'assistant') => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('institutionType', institution);
    }
  };

  if(isLoading){
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/bg2.jpg" // Ganti dengan path gambar Anda di folder public
          alt="Background"
          fill
          className="object-cover"
          quality={80}
          priority
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <Card className="shadow-2xl bg-background/60 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            {/* Logo Yayasan */}
            <div className="flex justify-center">
              <Image
                src="/logo.png" // Pastikan file logo.png ada di folder public
                alt="Logo Yayasan"
                width={120} // Sesuaikan ukuran sesuai kebutuhan
                height={120}
                className="object-contain"
              />
            </div>
            
            <CardTitle className="text-3xl font-bold">E - Absence</CardTitle>
            <CardDescription className="text-blue-1000">
              Selamat datang! Silakan pilih jenis lembaga Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Pilih Jenis Lembaga</Label>
               <RadioGroup defaultValue={institution} onValueChange={(value) => setInstitution(value as 'formal' | 'pesantren')} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="formal" id="formal" className="peer sr-only" />
                    <Label
                      htmlFor="formal"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Sekolah Formal
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="pesantren" id="pesantren" className="peer sr-only" />
                    <Label
                      htmlFor="pesantren"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      Pesantren
                    </Label>
                  </div>
                </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" asChild onClick={() => handleLogin('teacher')}>
              <Link href="/dashboard">
                <LogIn className="mr-2 h-4 w-4" />
                Masuk sebagai Guru / Ustadz
              </Link>
            </Button>
            {institution === 'formal' && (
                <Button variant="secondary" className="w-full" asChild onClick={() => handleLogin('assistant')}>
                    <Link href="/assistant/roll-call">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Masuk sebagai Assistant Instructor
                    </Link>
                </Button>
            )}
            <Button variant="outline" className="w-full" asChild onClick={() => handleLogin('admin')}>
              <Link href="/admin/classes">
                <UserCog className="mr-2 h-4 w-4" />
                Masuk sebagai Admin / Wali Kelas
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}