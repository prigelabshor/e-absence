
"use client";

import React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Student, AttendanceRecord, Class, InstitutionType } from "@/lib/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfToday, endOfToday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download, FileText, BarChart2, PieChart as PieChartIcon, Loader2, Percent } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getAllAttendanceForRecap, getAttendanceForRecap, getClasses, getStudentsByClass } from "@/lib/firestore-service";

type StudentStats = {
    student: Student;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    total: number;
    percentage: number;
};

export default function RekapHalaqahPage() {
    const institution: InstitutionType = 'pesantren'; // Hardcode to pesantren
    
    const I18N = {
        pageTitle: "Rekap Absensi Kurpes",
        pageDesc: "Lihat rekapitulasi dan statistik kehadiran santri di Kurpes.",
        filterTitle: "Filter Data",
        filterDesc: "Pilih Kurpes dan rentang waktu untuk melihat rekap.",
        classSelectPlaceholder: "Pilih Kurpes",
        tableTitle: "Tabel Rekap Kehadiran Kurpes",
        tableDesc: "Rincian jumlah kehadiran per santri.",
        studentNameCol: "Nama Santri",
        pdfTitle: "Rekap Absensi Kurpes",
        studentIdCol: "ID Santri",
      };

    const [classes, setClasses] = useState<Class[]>([]);
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
    
    const [selectedClass, setSelectedClass] = useState<string | undefined>();
    const [timeFilter, setTimeFilter] = useState("monthly"); // Default to monthly
    const [chartType, setChartType] = useState<"bar" | "pie">("bar");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingClassData, setIsLoadingClassData] = useState(false);
    const [isLoadingOverall, setIsLoadingOverall] = useState(true);

     useEffect(() => {
        setIsLoading(true);
        getClasses(institution)
        .then((classesData) => {
            setClasses(classesData);
            if (classesData.length > 0) {
                if(!selectedClass) {
                   setSelectedClass(classesData[0].id);
                }
            } else {
                 setIsLoading(false);
                 setIsLoadingOverall(false);
            }
        }).catch(error => {
            console.error("Failed to fetch initial data:", error);
            setIsLoading(false);
            setIsLoadingOverall(false);
        });
    }, [institution, selectedClass]);
    
    const getDateRange = useCallback(() => {
        const today = new Date();
        if (timeFilter === 'daily') {
            return { start: startOfToday(), end: endOfToday() };
        } else if (timeFilter === 'weekly') {
            return { start: startOfWeek(today), end: endOfWeek(today) };
        } else { // monthly
            return { start: startOfMonth(today), end: endOfMonth(today) };
        }
    }, [timeFilter]);

    useEffect(() => {
        const fetchOverallData = async () => {
             if (classes.length === 0) return;
            setIsLoadingOverall(true);
            try {
                const dateRange = getDateRange();
                const overallData = await getAllAttendanceForRecap(institution, dateRange.start, dateRange.end);
                setAllAttendance(overallData);
            } catch (error) {
                console.error("Failed to fetch overall attendance data:", error);
            } finally {
                setIsLoadingOverall(false);
            }
        }
        fetchOverallData();
    }, [timeFilter, institution, classes.length, getDateRange]);


    const fetchClassData = useCallback(async () => {
        if (!selectedClass) return;
        setIsLoadingClassData(true);

        try {
            const dateRange = getDateRange();
            const [studentsData, attendanceData] = await Promise.all([
                getStudentsByClass(institution, selectedClass),
                getAttendanceForRecap(institution, selectedClass, dateRange.start, dateRange.end),
            ]);
            
            setStudentsInClass(studentsData);
            setAttendance(attendanceData);

        } catch (error) {
            console.error("Failed to fetch class data:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingClassData(false);
        }
    }, [selectedClass, institution, getDateRange]);


    useEffect(() => {
        if(selectedClass){
            fetchClassData();
        }
    }, [selectedClass, fetchClassData]);


    const studentStats = useMemo((): StudentStats[] => {
        if (isLoadingClassData) return [];
        return studentsInClass.map(student => {
            const studentRecords = attendance.filter(r => r.studentId === student.id);
            const hadir = studentRecords.filter(r => r.status === 'hadir').length;
            const sakit = studentRecords.filter(r => r.status === 'sakit').length;
            const izin = studentRecords.filter(r => r.status === 'izin').length;
            const alfa = studentRecords.filter(r => r.status === 'alfa').length;
            const total = hadir + sakit + izin + alfa;
            return {
                student,
                hadir,
                sakit,
                izin,
                alfa,
                total,
                percentage: total > 0 ? ((hadir / (total - sakit - izin)) * 100) : 0,
            };
        });
    }, [studentsInClass, attendance, isLoadingClassData]);

    const totalStats = useMemo(() => {
        return studentStats.reduce((acc, curr) => {
            acc.hadir += curr.hadir;
            acc.sakit += curr.sakit;
            acc.izin += curr.izin;
            acc.alfa += curr.alfa;
            acc.total += curr.total;
            return acc;
        }, { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 });
    }, [studentStats]);

     const overallAttendancePercentage = useMemo(() => {
        if (allAttendance.length === 0) return "0";
        const totalHadir = allAttendance.filter(r => r.status === 'hadir').length;
        const totalValid = allAttendance.filter(r => r.status === 'hadir' || r.status === 'alfa').length;
        if (totalValid === 0) return "0";
        return ((totalHadir / totalValid) * 100).toFixed(1);
    }, [allAttendance]);

    const pieChartData = [
        { name: 'Hadir', value: totalStats.hadir, color: '#22c55e' },
        { name: 'Sakit', value: totalStats.sakit, color: '#f59e0b' },
        { name: 'Izin', value: totalStats.izin, color: '#3b82f6' },
        { name: 'Alfa', value: totalStats.alfa, color: '#ef4444' },
    ].filter(d => d.value > 0);
    
     const barChartData = studentStats.map(s => ({
        name: s.student.name.split(" ")[0], // Show first name only for brevity
        Hadir: s.hadir,
        Sakit: s.sakit,
        Izin: s.izin,
        Alfa: s.alfa
     }));


    const handleExportExcel = () => {
        const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "data";
        const worksheet = XLSX.utils.json_to_sheet(
            studentStats.map(s => ({
                [I18N.studentIdCol]: s.student.id,
                [I18N.studentNameCol]: s.student.name,
                'Hadir': s.hadir,
                'Sakit': s.sakit,
                'Izin': s.izin,
                'Alfa': s.alfa,
                'Persentase Kehadiran (%)': s.percentage.toFixed(1),
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');
        XLSX.writeFile(workbook, `rekap_absensi_${selectedClassName.replace(" ","_")}_${timeFilter}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "data";
        doc.text(`${I18N.pdfTitle} ${selectedClassName}`, 14, 15);
        doc.text(`Periode: ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`, 14, 22);
        
        autoTable(doc, {
            startY: 28,
            head: [[I18N.studentIdCol, I18N.studentNameCol, 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Kehadiran (%)']],
            body: studentStats.map(s => [s.student.id, s.student.name, s.hadir, s.sakit, s.izin, s.alfa, s.percentage.toFixed(1)]),
        });
        doc.save(`rekap_absensi_${selectedClassName.replace(" ","_")}_${timeFilter}.pdf`);
    };
    
    const renderContent = () => {
        if(isLoading) {
             return (
                 <div className="flex justify-center items-center col-span-full h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            )
        }
        if(!selectedClass || classes.length === 0){
             return <p className="text-center col-span-full py-12">Tidak ada data Kurpes yang bisa ditampilkan dari institusi pesantren.</p>
        }
        return (
             <div className="grid gap-6 lg:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Visualisasi Data Kehadiran</CardTitle>
                         <Tabs value={chartType} onValueChange={(value) => setChartType(value as "bar" | "pie")}>
                            <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="bar" className="h-6"><BarChart2 className="h-4 w-4"/></TabsTrigger>
                                <TabsTrigger value="pie" className="h-6"><PieChartIcon className="h-4 w-4"/></TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                        {isLoadingClassData ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                           <ResponsiveContainer>
                             {chartType === 'bar' ? (
                                <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={10} interval={0} angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Hadir" stackId="a" fill="#22c55e" name="Hadir" />
                                    <Bar dataKey="Sakit" stackId="a" fill="#f59e0b" name="Sakit" />
                                    <Bar dataKey="Izin" stackId="a" fill="#3b82f6" name="Izin" />
                                    <Bar dataKey="Alfa" stackId="a" fill="#ef4444" name="Alfa" />
                                </BarChart>
                             ) : (
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}>
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} (${(totalStats.total > 0 ? (value / totalStats.total) * 100 : 0).toFixed(1)}%)`, name]}/>
                                    <Legend />
                                </PieChart>
                             )}
                           </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{I18N.tableTitle}</CardTitle>
                        <CardDescription>{I18N.tableDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoadingClassData ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <div className="rounded-md border max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card">
                                        <TableRow>
                                            <TableHead>{I18N.studentNameCol}</TableHead>
                                            <TableHead className="text-center">Hadir</TableHead>
                                            <TableHead className="text-center">Sakit</TableHead>
                                            <TableHead className="text-center">Izin</TableHead>
                                            <TableHead className="text-center">Alfa</TableHead>
                                            <TableHead className="text-center">Persentase</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentStats.length > 0 ? studentStats.map(({ student, hadir, sakit, izin, alfa, percentage }) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell className="text-center">{hadir}</TableCell>
                                                <TableCell className="text-center">{sakit}</TableCell>
                                                <TableCell className="text-center">{izin}</TableCell>
                                                <TableCell className="text-center">
                                                  <span className={alfa > 0 ? 'text-destructive font-bold' : ''}>
                                                    {alfa}
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{percentage.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center">Tidak ada data untuk ditampilkan.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                         )}
                    </CardContent>
                     <CardFooter className="justify-end gap-2">
                        <Button variant="outline" onClick={handleExportExcel} disabled={isLoadingClassData || studentStats.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor Excel
                        </Button>
                        <Button variant="outline" onClick={handleExportPdf} disabled={isLoadingClassData || studentStats.length === 0}>
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Kehadiran Keseluruhan</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingOverall ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                         <>
                             <div className="text-2xl font-bold">{overallAttendancePercentage}%</div>
                             <p className="text-xs text-muted-foreground">
                                 Persentase kehadiran dari semua Kurpes ({timeFilter})
                             </p>
                         </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{I18N.filterTitle}</CardTitle>
                    <CardDescription>{I18N.filterDesc}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classes.length === 0}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder={I18N.classSelectPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Tabs value={timeFilter} onValueChange={(val) => val && setTimeFilter(val)}>
                        <TabsList>
                            <TabsTrigger value="daily">Harian</TabsTrigger>
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
