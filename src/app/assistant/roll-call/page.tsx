
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Class, Student, RollCallStatus, RollCallRecord } from "@/lib/types";
import { useInstitution } from "@/context/institution-context";
import { getClasses, getStudents, saveRollCall } from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type RollCallState = Record<string, RollCallStatus>;

export default function RollCallPage() {
    const { institution } = useInstitution();
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

    const initialAttendance: RollCallState = useMemo(() => students.reduce(
        (acc, student) => {
          acc[student.id] = "hadir";
          return acc;
        },
        {} as RollCallState
    ), [students]);

    const [attendance, setAttendance] = useState<RollCallState>(initialAttendance);
    
    useEffect(() => {
        setAttendance(initialAttendance);
    }, [initialAttendance]);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getStudents(institution),
            getClasses(institution)
        ]).then(([studentsData, classesData]) => {
            setStudents(studentsData);
            setClasses(classesData);
            setIsLoading(false);
        }).catch(error => {
            console.error(error);
            toast({ title: "Error", description: "Gagal memuat data santri/siswa.", variant: "destructive" });
            setIsLoading(false);
        });
    }, [institution, toast]);

    const handleStatusChange = (studentId: string, status: RollCallStatus) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async (classId: string, studentList: Student[]) => {
        setIsSubmitting(prev => ({ ...prev, [classId]: true }));
        
        const records: Pick<RollCallRecord, 'studentId' | 'status'>[] = studentList.map(student => ({
            studentId: student.id,
            status: attendance[student.id] || 'hadir',
        }));

        try {
            await saveRollCall(institution, records);
            toast({
                title: "Sukses",
                description: `Absensi apel untuk kelas/halaqah terpilih berhasil disimpan.`
            });
        } catch(error) {
            console.error("Error saving roll call:", error);
            toast({ title: "Error", description: "Gagal menyimpan absensi apel.", variant: "destructive" });
        } finally {
            setIsSubmitting(prev => ({ ...prev, [classId]: false }));
        }
    };
    
    const studentsByClass = useMemo(() => {
        return classes.map(c => ({
            ...c,
            students: students.filter(s => s.classId === c.id)
        })).filter(c => c.students.length > 0);
    }, [students, classes]);
    
    const getClassAttendanceSummary = useCallback((studentList: Student[]) => {
       return studentList.reduce(
        (acc, student) => {
            const status = attendance[student.id] || 'hadir';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        },
        { hadir: 0, sakit: 0, izin: 0, alfa: 0 } as Record<RollCallStatus, number>
        );
    }, [attendance]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Absensi Apel Pagi</h1>
                <p className="text-muted-foreground">
                     Klik pada setiap kelas/halaqah untuk mengisi dan menyimpan absensi apel hari ini ({new Date().toLocaleDateString("id-ID")}).
                </p>
            </div>
            
            {studentsByClass.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-4">
                    {studentsByClass.map((c) => {
                         const summary = getClassAttendanceSummary(c.students);
                         const isClassSubmitting = isSubmitting[c.id];
                         return(
                            <AccordionItem value={c.id} key={c.id} className="border rounded-lg bg-card">
                                 <AccordionTrigger className="p-4 sm:p-6 hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-semibold">{institution === 'formal' ? 'Kelas' : 'Halaqah'}: {c.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Hadir: {summary.hadir}, Sakit: {summary.sakit}, Izin: {summary.izin}, Tidak Hadir: {summary.alfa}
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 sm:px-6 pb-4">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama ({institution === 'formal' ? 'Siswa' : 'Santri'})</TableHead>
                                                    <TableHead className="w-auto sm:w-[450px]">Status Kehadiran</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {c.students.map(student => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-medium">{student.name} <span className="text-muted-foreground text-xs">({student.dormitory || 'Asrama -'})</span></TableCell>
                                                        <TableCell>
                                                            <RadioGroup
                                                                defaultValue="hadir"
                                                                value={attendance[student.id]}
                                                                onValueChange={(value) => handleStatusChange(student.id, value as RollCallStatus)}
                                                                className="flex flex-wrap items-center gap-x-4 gap-y-2"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="hadir" id={`${student.id}-hadir`} />
                                                                    <Label htmlFor={`${student.id}-hadir`}>Hadir</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="sakit" id={`${student.id}-sakit`} />
                                                                    <Label htmlFor={`${student.id}-sakit`}>Sakit</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="izin" id={`${student.id}-izin`} />
                                                                    <Label htmlFor={`${student.id}-izin`}>Izin</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="alfa" id={`${student.id}-alfa`} />
                                                                    <Label htmlFor={`${student.id}-alfa`} className="text-red-600">Tidak Hadir</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <Button onClick={() => handleSubmit(c.id, c.students)} disabled={isClassSubmitting} className="w-full sm:w-auto">
                                            {isClassSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Simpan Absensi {c.name}
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                         )
                    })}
                </Accordion>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Data Kosong</CardTitle>
                        <CardDescription>Belum ada siswa yang terdaftar. Silakan hubungi admin.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
