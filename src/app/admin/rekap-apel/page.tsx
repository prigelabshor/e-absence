
"use client";

import React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useInstitution } from "@/context/institution-context";
import type { Student, Class, RollCallRecord, RollCallStatus } from "@/lib/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfToday, endOfToday, subDays, format } from 'date-fns';
import { Loader2, UserX, Users, UserCheck, Percent, Download, FileText } from "lucide-react";
import { getRollCallForRecap, getClasses, getStudents } from "@/lib/firestore-service";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type DetailedRollCallRecord = RollCallRecord & { studentName: string; className: string; };

export default function RekapApelPage() {
    const { institution } = useInstitution();
    
    const I18N = {
        pageTitle: "Rekap Kehadiran Apel",
        pageDesc: "Lihat rekapitulasi dan statistik kehadiran siswa/santri saat apel.",
        filterTitle: "Filter Waktu",
        filterDesc: "Pilih rentang waktu untuk melihat rekap.",
        studentNameCol: institution === 'formal' ? "Nama Siswa" : "Nama Santri",
        classNameCol: institution === 'formal' ? "Kelas" : "Halaqah",
        tableTitle: "Daftar Siswa Tidak Hadir Apel",
        tableDesc: "Rincian siswa/santri yang tidak hadir (alfa) saat apel pada periode terpilih.",
        overallAttendance: "Kehadiran Apel Keseluruhan",
        noteCol: "Keterangan",
      };

    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [rollCall, setRollCall] = useState<RollCallRecord[]>([]);
    const [timeFilter, setTimeFilter] = useState("daily");
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getClasses(institution),
            getStudents(institution),
        ]).then(([classesData, studentsData]) => {
            setClasses(classesData);
            setAllStudents(studentsData);
        }).catch(error => {
            console.error("Failed to fetch initial data:", error);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [institution]);

    const fetchRollCallData = useCallback(async () => {
        setIsLoading(true);
        try {
            let startDate, endDate;
            const today = new Date();
            if (timeFilter === 'daily') {
                startDate = startOfToday();
                endDate = endOfToday();
            } else if (timeFilter === 'weekly') {
                startDate = startOfWeek(today);
                endDate = endOfWeek(today);
            } else { // monthly
                startDate = startOfMonth(today);
                endDate = endOfMonth(today);
            }

            const rollCallData = await getRollCallForRecap(institution, startDate, endDate);
            setRollCall(rollCallData);

        } catch (error) {
            console.error("Failed to fetch roll call data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [timeFilter, institution]);

    useEffect(() => {
        fetchRollCallData();
    }, [fetchRollCallData]);

    const detailedRollCall = useMemo((): DetailedRollCallRecord[] => {
        return rollCall
            .map(record => {
                const student = allStudents.find(s => s.id === record.studentId);
                const studentClass = classes.find(c => c.id === student?.classId);
                return {
                    ...record,
                    studentName: student?.name || 'Nama Tidak Ditemukan',
                    className: studentClass?.name || 'Kelas Tidak Diketahui'
                };
            });
    }, [rollCall, allStudents, classes]);

    const rollCallAlfa = useMemo(() => detailedRollCall.filter(r => r.status === 'alfa'), [detailedRollCall]);

    const rollCallStats = useMemo(() => {
         const totalHadir = detailedRollCall.filter(r => r.status === 'hadir').length;
         const totalAlfa = rollCallAlfa.length;
         const totalStudentsInRecords = new Set(detailedRollCall.map(r => r.studentId)).size;
         const totalDays = new Set(detailedRollCall.map(r => format(new Date(r.date), 'yyyy-MM-dd'))).size || 1;
         const potentialAttendance = allStudents.length * totalDays;

         const recordedPresent = detailedRollCall.filter(r => r.status === 'hadir').length;
         
         const attendancePercentage = potentialAttendance > 0 
            ? ((recordedPresent / potentialAttendance) * 100).toFixed(1)
            : 0;

         return {
            totalHadir,
            totalAlfa,
            attendancePercentage,
            totalStudents: allStudents.length
         }
    }, [detailedRollCall, rollCallAlfa, allStudents.length]);

    const handleExportExcel = () => {
        const dataToExport = rollCallAlfa.map(r => ({
            Tanggal: format(new Date(r.date), 'dd MMMM yyyy'),
            [I18N.studentNameCol]: r.studentName,
            [I18N.classNameCol]: r.className,
            [I18N.noteCol]: r.notes || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tidak Hadir Apel');
        XLSX.writeFile(workbook, `rekap_tidak_hadir_apel_${timeFilter}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Rekap Tidak Hadir Apel - Periode ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`, 14, 15);

        autoTable(doc, {
            startY: 22,
            head: [['Tanggal', I18N.studentNameCol, I18N.classNameCol, I18N.noteCol]],
            body: rollCallAlfa.map(r => [
                format(new Date(r.date), 'dd MMMM yyyy'),
                r.studentName,
                r.className,
                r.notes || '-'
            ]),
        });
        doc.save(`rekap_tidak_hadir_apel_${timeFilter}.pdf`);
    };
    

    const renderContent = () => {
        if(isLoading) {
             return (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            )
        }

        return (
             <div className="grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{I18N.overallAttendance}</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{rollCallStats.attendancePercentage}%</div>
                             <p className="text-xs text-muted-foreground">
                                 Berdasarkan data yang tercatat
                             </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Kehadiran Tercatat</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{rollCallStats.totalHadir}</div>
                             <p className="text-xs text-muted-foreground">
                                Total catatan hadir
                             </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tidak Hadir (Alfa)</CardTitle>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold text-destructive">{rollCallStats.totalAlfa}</div>
                              <p className="text-xs text-muted-foreground">
                                Total catatan tanpa keterangan
                             </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Siswa/Santri</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{rollCallStats.totalStudents}</div>
                              <p className="text-xs text-muted-foreground">
                                Jumlah siswa/santri terdaftar
                             </p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>{I18N.tableTitle}</CardTitle>
                        <CardDescription>{I18N.tableDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-md border max-h-[400px] overflow-y-auto">
                            <Table>
                                 <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>{I18N.studentNameCol}</TableHead>
                                        <TableHead>{I18N.classNameCol}</TableHead>
                                        <TableHead>{I18N.noteCol}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rollCallAlfa.length > 0 ? rollCallAlfa.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{format(new Date(record.date), 'dd MMMM yyyy')}</TableCell>
                                            <TableCell>{record.studentName}</TableCell>
                                            <TableCell>{record.className}</TableCell>
                                            <TableCell className="text-muted-foreground">{record.notes || '-'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                Tidak ada data siswa/santri yang tidak hadir apel pada periode ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                        <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || rollCallAlfa.length === 0} className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor Excel
                        </Button>
                        <Button variant="outline" onClick={handleExportPdf} disabled={isLoading || rollCallAlfa.length === 0} className="w-full sm:w-auto">
                            <FileText className="mr-2 h-4 w-4" />
                            Ekspor PDF
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{I18N.pageTitle}</h1>
                <p className="text-muted-foreground">{I18N.pageDesc}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{I18N.filterTitle}</CardTitle>
                    <CardDescription>{I18N.filterDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                     <Tabs value={timeFilter} onValueChange={(val) => val && setTimeFilter(val)}>
                        <TabsList>
                            <TabsTrigger value="daily">Hari Ini</TabsTrigger>
                            <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>
            
            {renderContent()}
        </div>
    );
}

    
