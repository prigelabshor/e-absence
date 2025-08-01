
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import type { AttendanceStatus, Student, Class, Subject } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstitution } from "@/context/institution-context";
import { getClassById, getStudentsByClass, getSubjects, saveAttendance } from "@/lib/firestore-service";
import { Loader2 } from "lucide-react";

type AttendanceState = Record<string, AttendanceStatus>;

export default function AttendancePage() {
  const params = useParams();
  const { toast } = useToast();
  const { institution } = useInstitution();
  
  const classId = params.classId as string;
  
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [classData, studentsData, subjectsData] = await Promise.all([
                getClassById(institution, classId),
                getStudentsByClass(institution, classId),
                getSubjects(institution)
            ]);
            setCurrentClass(classData);
            const sortedStudents = studentsData.sort((a, b) => a.name.localeCompare(b.name));
            setStudentsInClass(sortedStudents);
            setSubjects(subjectsData);
            if (subjectsData.length > 0) {
                setSelectedSubject(subjectsData[0].id);
            }
        } catch(error) {
            console.error(error);
            toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [institution, classId, toast]);

  const I18N = institution === 'formal'
    ? {
        title: `Absensi Kelas ${currentClass?.name || ''}`,
        listTitle: "Daftar Siswa",
        listDesc: "Pilih mata pelajaran dan tandai status kehadiran setiap siswa.",
        subjectLabel: "Mata Pelajaran",
        subjectPlaceholder: "Pilih mata pelajaran",
        idCol: "ID Siswa",
        nameCol: "Nama",
        toastSuccess: `Absensi untuk kelas ${currentClass?.name} telah berhasil dicatat.`,
        toastError: "Silakan pilih mata pelajaran terlebih dahulu.",
        classNotFound: "Kelas tidak ditemukan."
      }
    : {
        title: `Absensi Kelas ${currentClass?.name || ''}`,
        listTitle: "Daftar Santri",
        listDesc: "Pilih kelas/materi dan tandai status kehadiran setiap santri.",
        subjectLabel: "Kelas/Materi",
        subjectPlaceholder: "Pilih kelas/materi",
        idCol: "ID Santri",
        nameCol: "Nama",
        toastSuccess: `Absensi untuk kelas ${currentClass?.name} telah berhasil dicatat.`,
        toastError: "Silakan pilih kelas/materi terlebih dahulu.",
        classNotFound: "Kelas tidak ditemukan."
      };
      
  const initialAttendance: AttendanceState = useMemo(() => studentsInClass.reduce(
    (acc, student) => {
      acc[student.id] = "hadir";
      return acc;
    },
    {} as AttendanceState
  ), [studentsInClass]);

  const [attendance, setAttendance] = useState<AttendanceState>(initialAttendance);

  useEffect(() => {
    setAttendance(initialAttendance);
  }, [initialAttendance]);


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const attendanceSummary = useMemo(() => {
    return Object.values(attendance).reduce(
      (acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { hadir: 0, sakit: 0, izin: 0, alfa: 0 } as Record<AttendanceStatus, number>
    );
  }, [attendance]);

  const handleSubmit = async () => {
    if(!selectedSubject) {
        toast({
            title: "Gagal",
            description: I18N.toastError,
            variant: "destructive",
        });
        return;
    }

    try {
        await saveAttendance(institution, classId, selectedSubject, attendance);
        toast({
            title: "Absensi Tersimpan",
            description: I18N.toastSuccess,
            variant: "default",
        });
    } catch (error) {
        console.error("Error saving attendance:", error);
        toast({
            title: "Gagal",
            description: "Terjadi kesalahan saat menyimpan absensi.",
            variant: "destructive",
        });
    }
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>
  }

  if (!currentClass) {
    return <div>{I18N.classNotFound}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {I18N.title}
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hadir</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.hadir}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sakit</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.sakit}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Izin</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.izin}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alfa</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{attendanceSummary.alfa}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{I18N.listTitle}</CardTitle>
          <CardDescription>
            {I18N.listDesc}
          </CardDescription>
          <div className="pt-4">
            <Label htmlFor="subject" className="mb-2 block">{I18N.subjectLabel}</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject" className="w-full md:w-[300px]">
                    <SelectValue placeholder={I18N.subjectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">{I18N.idCol}</TableHead>
                  <TableHead>{I18N.nameCol}</TableHead>
                  <TableHead className="w-auto sm:w-[450px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length > 0 ? (
                    studentsInClass.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell className="font-medium truncate max-w-[100px] hidden sm:table-cell">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                        <RadioGroup
                            defaultValue="hadir"
                            value={attendance[student.id]}
                            onValueChange={(value) =>
                            handleStatusChange(student.id, value as AttendanceStatus)
                            }
                            className="flex flex-wrap items-center gap-x-4 gap-y-2"
                        >
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hadir" id={`${student.id}-hadir`} />
                            <Label htmlFor={`${student.id}-hadir`} className="cursor-pointer">Hadir</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sakit" id={`${student.id}-sakit`} />
                            <Label htmlFor={`${student.id}-sakit`} className="cursor-pointer">Sakit</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="izin" id={`${student.id}-izin`} />
                            <Label htmlFor={`${student.id}-izin`} className="cursor-pointer">Izin</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                            <RadioGroupItem value="alfa" id={`${student.id}-alfa`} />
                            <Label htmlFor={`${student.id}-alfa`} className="cursor-pointer text-red-600">Alfa</Label>
                            </div>
                        </RadioGroup>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">Belum ada {institution === 'formal' ? 'siswa' : 'santri'} di kelas ini.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={studentsInClass.length === 0 || !selectedSubject} className="w-full sm:w-auto">Simpan Absensi</Button>
      </div>
    </div>
  );
}
