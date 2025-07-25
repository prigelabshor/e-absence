
"use client";

import React, { useState, useEffect } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import type { Subject } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useInstitution } from "@/context/institution-context";
import { getSubjects, addSubject, updateSubject, deleteSubject } from "@/lib/firestore-service";

export default function SubjectsPage() {
  const { institution } = useInstitution();
  
  const I18N = institution === 'formal'
    ? {
        title: "Kelola Mata Pelajaran",
        desc: "Tambah, ubah, atau hapus data mata pelajaran.",
        addBtn: "Tambah Mapel Baru",
        listTitle: "Daftar Mata Pelajaran",
        listDesc: "Daftar semua mata pelajaran yang tersedia.",
        idCol: "ID Mapel",
        nameCol: "Nama Mata Pelajaran",
        editTitle: "Ubah Mata Pelajaran",
        addTitle: "Tambah Mapel Baru",
        editDesc: "Perbarui detail mata pelajaran ini.",
        addDesc: "Isi detail untuk mata pelajaran baru.",
        successDelete: "Mata pelajaran berhasil dihapus.",
        successUpdate: "Mata pelajaran berhasil diperbarui.",
        successAdd: "Mata pelajaran baru berhasil ditambahkan.",
        errorEmpty: "Nama mata pelajaran tidak boleh kosong.",
      }
    : {
        title: "Kelola Kitab/Materi",
        desc: "Tambah, ubah, atau hapus data kitab/materi.",
        addBtn: "Tambah Kitab Baru",
        listTitle: "Daftar Kitab/Materi",
        listDesc: "Daftar semua kitab/materi yang tersedia.",
        idCol: "ID Kitab",
        nameCol: "Nama Kitab/Materi",
        editTitle: "Ubah Kitab/Materi",
        addTitle: "Tambah Kitab Baru",
        editDesc: "Perbarui detail kitab ini.",
        addDesc: "Isi detail untuk kitab baru.",
        successDelete: "Kitab/materi berhasil dihapus.",
        successUpdate: "Kitab/materi berhasil diperbarui.",
        successAdd: "Kitab/materi baru berhasil ditambahkan.",
        errorEmpty: "Nama kitab/materi tidak boleh kosong.",
      };

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    setIsLoading(true);
    getSubjects(institution)
      .then(data => {
          setSubjects(data);
          setIsLoading(false);
      })
      .catch(error => {
          console.error("Error fetching subjects:", error);
          toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" });
          setIsLoading(false);
      });
  }, [institution, toast]);

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (subjectId: string) => {
    try {
        await deleteSubject(institution, subjectId);
        setSubjects(subjects.filter((s) => s.id !== subjectId));
        toast({ title: "Sukses", description: I18N.successDelete });
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive" });
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subjectName = formData.get("name") as string;

    if (!subjectName) {
        toast({ title: "Gagal", description: I18N.errorEmpty, variant: "destructive" });
        return;
    }
    
    try {
        if (editingSubject) {
            await updateSubject(institution, editingSubject.id, { name: subjectName });
            setSubjects(subjects.map(s => s.id === editingSubject.id ? {...s, name: subjectName } : s));
            toast({ title: "Sukses", description: I18N.successUpdate });
        } else {
            const newId = await addSubject(institution, { name: subjectName });
            setSubjects([...subjects, { id: newId, name: subjectName }]);
            toast({ title: "Sukses", description: I18N.successAdd });
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" });
    } finally {
        setIsDialogOpen(false);
        setEditingSubject(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="text-center h-24">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </TableCell>
        </TableRow>
      );
    }
    if (subjects.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="text-center h-24">
            Tidak ada data untuk ditampilkan.
          </TableCell>
        </TableRow>
      );
    }
    return subjects.map((s) => (
      <TableRow key={s.id}>
        <TableCell className="font-medium truncate max-w-[100px]">{s.id}</TableCell>
        <TableCell>{s.name}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </TableCell>
      </TableRow>
    ));
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{I18N.title}</h1>
          <p className="text-muted-foreground">{I18N.desc}</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {I18N.addBtn}
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>{I18N.listTitle}</CardTitle>
            <CardDescription>{I18N.listDesc}</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{I18N.idCol}</TableHead>
                <TableHead>{I18N.nameCol}</TableHead>
                <TableHead className="text-right w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSubject ? I18N.editTitle : I18N.addTitle}</DialogTitle>
            <DialogDescription>
              {editingSubject ? I18N.editDesc : I18N.addDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input id="name" name="name" defaultValue={editingSubject?.name} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
