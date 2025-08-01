
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
import { useInstitution } from "@/context/institution-context";
import { addClass, deleteClass, getClasses, updateClass } from "@/lib/firestore-service";
import type { Class } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


export default function ClassesPage() {
  const { institution } = useInstitution();
  const { toast } = useToast();
  const I18N = institution === 'formal' ? 
    { title: "Kelola Kelas", desc: "Tambah, ubah, atau hapus data kelas dari sistem.", btn: "Tambah Kelas Baru", listTitle: "Daftar Kelas", listDesc: "Daftar semua kelas yang tersedia.", id: "ID Kelas", name: "Nama Kelas", grade: "Tingkat", editTitle: "Ubah Kelas", addTitle: "Tambah Kelas Baru", editDesc: "Perbarui detail untuk kelas ini.", addDesc: "Isi detail untuk kelas baru." } :
    { title: "Kelola Program", desc: "Tambah, ubah, atau hapus data program dari sistem.", btn: "Tambah Program Baru", listTitle: "Daftar Program", listDesc: "Daftar semua Program yang tersedia.", id: "ID Program", name: "Nama Program", grade: "Marhalah", editTitle: "Ubah Program", addTitle: "Tambah Program Baru", editDesc: "Perbarui detail untuk program ini.", addDesc: "Isi detail untuk program baru." };

  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    if (institution) {
      setIsLoading(true);
      getClasses(institution)
        .then(data => {
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
            setClasses(sortedData);
            setIsLoading(false);
        })
        .catch(error => {
            console.error("Error fetching classes:", error);
            toast({ title: "Error", description: "Gagal memuat data kelas.", variant: "destructive" });
            setIsLoading(false);
        });
    }
  }, [institution, toast]);


  const handleEdit = (c: Class) => {
    setEditingClass(c);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (classId: string) => {
    try {
        await deleteClass(institution, classId);
        setClasses(classes.filter((c) => c.id !== classId));
        toast({ title: "Sukses", description: "Data berhasil dihapus."});
    } catch(error) {
        console.error("Error deleting class:", error);
        toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive" });
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const classData = {
        name: formData.get("name") as string,
        grade: formData.get("grade") as string,
    };
    
    try {
        if (editingClass) {
            await updateClass(institution, editingClass.id, classData);
            setClasses(classes.map(c => c.id === editingClass.id ? { id: editingClass.id, ...classData } : c));
            toast({ title: "Sukses", description: "Data berhasil diperbarui."});
        } else {
            const newId = await addClass(institution, classData);
            setClasses([...classes, {id: newId, ...classData}]);
            toast({ title: "Sukses", description: "Data baru berhasil disimpan."});
        }
    } catch(error) {
        console.error("Error saving class:", error);
        toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" });
    } finally {
        setIsDialogOpen(false);
        setEditingClass(null);
    }
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
          {I18N.btn}
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
                <TableHead>{I18N.id}</TableHead>
                <TableHead>{I18N.name}</TableHead>
                <TableHead>{I18N.grade}</TableHead>
                <TableHead className="text-right w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        Tidak ada data untuk ditampilkan.
                    </TableCell>
                </TableRow>
              ) : (
                classes.map((c) => (
                    <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.grade}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClass ? I18N.editTitle : I18N.addTitle}</DialogTitle>
            <DialogDescription>
              {editingClass ? I18N.editDesc : I18N.addDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input id="name" name="name" defaultValue={editingClass?.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">
                {institution === 'formal' ? 'Tingkat' : 'Marhalah'}
              </Label>
              <Input id="grade" name="grade" defaultValue={editingClass?.grade} className="col-span-3" />
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
