"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, Trash2, PlusCircle, Upload, Loader2, Search } from "lucide-react";
import type { Student, Class, Dormitory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { useInstitution } from "@/context/institution-context";
import { addStudent, deleteStudent, getStudents, updateStudent, getClasses, addMultipleStudents, getDormitories } from "@/lib/firestore-service";

const NO_DORMITORY_VALUE = "__none__";

export default function StudentsPage() {
  const { institution } = useInstitution();
  
  const I18N = institution === 'formal' 
    ? { 
        title: "Kelola Siswa",
        desc: "Tambah, ubah, hapus, atau impor data siswa.",
        addBtn: "Tambah Siswa Baru",
        listTitle: "Daftar Siswa",
        listDesc: "Daftar semua siswa, dikelompokkan berdasarkan kelas.",
        idCol: "ID Siswa",
        nameCol: "Nama Siswa",
        dormCol: "Asrama",
        editTitle: "Ubah Siswa",
        addTitle: "Tambah Siswa Baru",
        editDesc: "Perbarui detail siswa.",
        addDesc: "Isi detail untuk siswa baru.",
        classLabel: "Kelas",
        importTitle: "Impor Data Siswa",
        importDesc: "Unggah file Excel (.xlsx) dengan kolom 'name', 'classId', dan 'dormitory' (opsional).",
        importSuccess: "siswa berhasil diimpor.",
        classIdNotFound: "Class ID tidak ditemukan.",
        searchStudentPlaceholder: "Cari siswa...",
        searchClassPlaceholder: "Filter kelas...",
      } 
    : {
        title: "Kelola Santri",
        desc: "Tambah, ubah, hapus, atau impor data santri.",
        addBtn: "Tambah Santri Baru",
        listTitle: "Daftar Santri",
        listDesc: "Daftar semua santri, dikelompokkan berdasarkan halaqah.",
        idCol: "ID Santri",
        nameCol: "Nama Santri",
        dormCol: "Asrama/Kamar",
        editTitle: "Ubah Santri",
        addTitle: "Tambah Santri Baru",
        editDesc: "Perbarui detail santri.",
        addDesc: "Isi detail untuk santri baru.",
        classLabel: "Halaqah",
        importTitle: "Impor Data Santri",
        importDesc: "Unggah file Excel (.xlsx) dengan kolom 'name', 'classId', dan 'dormitory'.",
        importSuccess: "santri berhasil diimpor.",
        classIdNotFound: "Halaqah ID tidak ditemukan.",
        searchStudentPlaceholder: "Cari santri...",
        searchClassPlaceholder: "Filter halaqah...",
      };

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
        try {
            const [studentsData, classesData, dormitoriesData] = await Promise.all([
                getStudents(institution),
                getClasses(institution),
                getDormitories(institution)
            ]);
            setStudents(studentsData);
            setClasses(classesData);
            setDormitories(dormitoriesData);
        } catch(error) {
            console.error(error);
            toast({title: "Error", description: "Gagal memuat data.", variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [institution, toast]);

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(classSearch.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormDialogOpen(true);
  };
  
  const handleDelete = async (studentId: string) => {
    try {
        await deleteStudent(institution, studentId);
        setStudents(students.filter((s) => s.id !== studentId));
        toast({ title: "Sukses", description: "Data berhasil dihapus."});
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive"});
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const classId = formData.get('classId') as string;
    let dormitoryValue = formData.get("dormitory") as string;

    if (dormitoryValue === NO_DORMITORY_VALUE) {
        dormitoryValue = "";
    }

    const studentData: Omit<Student, 'id'> = {
        name: formData.get("name") as string,
        classId: classId,
        dormitory: dormitoryValue,
    };
    
    try {
        if (editingStudent) {
            await updateStudent(institution, editingStudent.id, studentData);
            setStudents(students.map(s => s.id === editingStudent.id ? { id: editingStudent.id, ...studentData } : s));
            toast({ title: "Sukses", description: `Data ${I18N.classLabel} berhasil diperbarui.` });
        } else {
            const newId = await addStudent(institution, studentData);
            setStudents([...students, {id: newId, ...studentData}]);
            toast({ title: "Sukses", description: `${I18N.classLabel} baru berhasil ditambahkan.` });
        }
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive"});
    } finally {
        setIsFormDialogOpen(false);
        setEditingStudent(null);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet);

          const studentsToImport: Omit<Student, 'id'>[] = json.map((row, index) => {
            const classExists = classes.find(c => c.id === row.classId);
            if (!row.name || !row.classId) {
                throw new Error(`Baris ${index + 2}: Kolom 'name' dan 'classId' wajib diisi.`);
            }
            if (!classExists) {
                throw new Error(`Baris ${index + 2}: ${I18N.classIdNotFound} '${row.classId}'.`);
            }
            return {
              name: row.name,
              classId: row.classId,
              dormitory: row.dormitory || '',
            };
          });

          if(studentsToImport.length > 0) {
              const newStudentIds = await addMultipleStudents(institution, studentsToImport);
              const newStudentsWithIds = studentsToImport.map((student, index) => ({...student, id: newStudentIds[index]}));
              setStudents(prev => [...prev, ...newStudentsWithIds]);
              toast({ title: "Sukses", description: `${newStudentsWithIds.length} ${I18N.importSuccess}` });
          }

          setIsImportDialogOpen(false);
        } catch (error: any) {
          toast({
            title: "Gagal Impor",
            description: error.message || "Format file tidak valid. Pastikan kolom 'name' dan 'classId' ada.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        )
    }

    if (classes.length === 0) {
        return <p className="text-center py-12">Silakan tambahkan data {I18N.classLabel.toLowerCase()} terlebih dahulu di halaman Kelola {I18N.classLabel}.</p>
    }

    return (
        filteredClasses.map(c => {
          const classStudents = filteredStudents.filter(s => s.classId === c.id);
          if (classStudents.length === 0) return null;
          
          return (
            <div key={c.id} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{c.name}</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{I18N.idCol}</TableHead>
                      <TableHead>{I18N.nameCol}</TableHead>
                      <TableHead>{I18N.dormCol}</TableHead>
                      <TableHead className="text-right w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium truncate max-w-[100px]">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.dormitory || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{I18N.title}</h1>
          <p className="text-muted-foreground">{I18N.desc}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsImportDialogOpen(true)} disabled={classes.length === 0} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Impor dari Excel
            </Button>
            <Button onClick={handleAddNew} disabled={classes.length === 0} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {I18N.addBtn}
            </Button>
        </div>
      </div>

      {/* Search Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={I18N.searchStudentPlaceholder}
            className="pl-8"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={I18N.searchClassPlaceholder}
            className="pl-8"
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>{I18N.listTitle}</CardTitle>
            <CardDescription>{I18N.listDesc}</CardDescription>
        </CardHeader>
        <CardContent>
           {renderContent()}
           {filteredClasses.length > 0 && filteredStudents.length === 0 && (
             <p className="text-center py-4">Tidak ditemukan siswa/santri dengan kriteria pencarian tersebut.</p>
           )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingStudent ? I18N.editTitle : I18N.addTitle}</DialogTitle>
            <DialogDescription>
              {editingStudent ? I18N.editDesc : I18N.addDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama</Label>
                <Input id="name" name="name" defaultValue={editingStudent?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classId" className="text-right">{I18N.classLabel}</Label>
                <Select name="classId" defaultValue={editingStudent?.classId} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={`Pilih ${I18N.classLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dormitory" className="text-right">{I18N.dormCol}</Label>
                <Select name="dormitory" defaultValue={editingStudent?.dormitory || NO_DORMITORY_VALUE}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih asrama/kamar" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value={NO_DORMITORY_VALUE}>- Tidak ada -</SelectItem>
                        {dormitories.map(d => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{I18N.importTitle}</DialogTitle>
            <DialogDescription>
             {I18N.importDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <Input
                id="excelFile"
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileImport}
                className="col-span-3"
              />
              <p className="text-xs text-muted-foreground">
                Pastikan file Anda memiliki header 'name', 'classId', dan 'dormitory' (opsional).
              </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
