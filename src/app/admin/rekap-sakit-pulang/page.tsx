
"use client";

import React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useInstitution } from "@/context/institution-context";
import type { Student, Class, RollCallRecord } from "@/lib/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfToday, endOfToday, format } from 'date-fns';
import { Loader2, Bed, LogOut, Download, FileText } from "lucide-react";
import { getRollCallForRecap, getClasses, getStudents } from "@/lib/firestore-service";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type DetailedRollCallRecord = RollCallRecord & { studentName: string; className: string; };

export default function RekapSakitPulangPage() {
    const { institution } = useInstitution();
    
    const I18N = {
        pageTitle: "Rekap Sakit & Izin",
        pageDesc: "Lihat rekapitulasi siswa/santri yang sakit atau izin.",
        filterTitle: "Filter Waktu",
        filterDesc: "Pilih rentang waktu untuk melihat rekap.",
        studentNameCol: institution === 'formal' ? "Nama Siswa" : "Nama Santri",
        classNameCol: institution === 'formal' ? "Kelas" : "Halaqah",
        noteCol: "Keterangan",
        dateCol: "Tanggal",
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
        }).finally(() => setIsLoading(false));
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

    const sickRecords = useMemo(() => detailedRollCall.filter(r => r.status === 'sakit'), [detailedRollCall]);
    const leaveRecords = useMemo(() => detailedRollCall.filter(r => r.status === 'izin'), [detailedRollCall]);

    const handleExport = (type: 'pdf' | 'excel', dataType: 'sakit' | 'izin') => {
        const records = dataType === 'sakit' ? sickRecords : leaveRecords;
        const title = dataType === 'sakit' ? 'Rekap Siswa Sakit' : 'Rekap Izin';
        const fileName = `${title.toLowerCase().replace(/ /g, '_')}_${timeFilter}`;

        const dataToExport = records.map(r => ({
            [I18N.dateCol]: format(new Date(r.date), 'dd/MM/yyyy'),
            [I18N.studentNameCol]: r.studentName,
            [I18N.classNameCol]: r.className,
            [I18N.noteCol]: r.notes || '-',
        }));

        if (type === 'excel') {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, title);
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.text(`${title} - Periode ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`, 14, 15);
            autoTable(doc, {
                startY: 22,
                head: [[I18N.dateCol, I18N.studentNameCol, I18N.classNameCol, I18N.noteCol]],
                body: records.map(r => [
                    format(new Date(r.date), 'dd/MM/yyyy'),
                    r.studentName,
                    r.className,
                    r.notes || '-',
                ]),
            });
            doc.save(`${fileName}.pdf`);
        }
    };

    const renderDetailedCard = (
        title: string,
        icon: React.ElementType,
        data: DetailedRollCallRecord[],
        emptyMessage: string,
        dataType: 'sakit' | 'izin'
    ) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{data.length} catatan ditemukan</CardDescription>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                   {React.createElement(icon, { className: "h-6 w-6 text-primary" })}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>{I18N.dateCol}</TableHead>
                                <TableHead>{I18N.studentNameCol}</TableHead>
                                <TableHead>{I18N.classNameCol}</TableHead>
                                <TableHead>{I18N.noteCol}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{record.studentName}</TableCell>
                                        <TableCell>{record.className}</TableCell>
                                        <TableCell className="text-muted-foreground">{record.notes || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                <Button variant="outline" onClick={() => handleExport('excel', dataType)} disabled={isLoading || data.length === 0} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Ekspor Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf', dataType)} disabled={isLoading || data.length === 0} className="w-full sm:w-auto">
                    <FileText className="mr-2 h-4 w-4" />
                    Ekspor PDF
                </Button>
            </CardFooter>
        </Card>
    );

    const renderContent = () => {
        if(isLoading) {
             return (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            )
        }

        return (
             <div className="grid gap-6 lg:grid-cols-2">
                {renderDetailedCard("Rekap Siswa Sakit", Bed, sickRecords, "Tidak ada siswa/santri yang dilaporkan sakit pada periode ini.", 'sakit')}
                {renderDetailedCard("Rekap Izin", LogOut, leaveRecords, "Tidak ada siswa/santri yang izin pada periode ini.", 'izin')}
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
