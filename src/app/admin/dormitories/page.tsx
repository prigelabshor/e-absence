
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
import type { Dormitory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useInstitution } from "@/context/institution-context";
import { getDormitories, addDormitory, updateDormitory, deleteDormitory } from "@/lib/firestore-service";

export default function DormitoriesPage() {
  const { institution } = useInstitution();
  
  const I18N = {
        title: "Kelola Asrama/Kamar",
        desc: "Tambah, ubah, atau hapus data asrama/kamar.",
        addBtn: "Tambah Asrama Baru",
        listTitle: "Daftar Asrama/Kamar",
        listDesc: "Daftar semua asrama/kamar yang tersedia.",
        idCol: "ID Asrama",
        nameCol: "Nama Asrama/Kamar",
        editTitle: "Ubah Asrama",
        addTitle: "Tambah Asrama Baru",
        editDesc: "Perbarui detail asrama ini.",
        addDesc: "Isi detail untuk asrama baru.",
        successDelete: "Asrama berhasil dihapus.",
        successUpdate: "Asrama berhasil diperbarui.",
        successAdd: "Asrama baru berhasil ditambahkan.",
        errorEmpty: "Nama asrama tidak boleh kosong.",
      };

  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDormitory, setEditingDormitory] = useState<Dormitory | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    setIsLoading(true);
    getDormitories(institution)
      .then(data => {
          setDormitories(data);
          setIsLoading(false);
      })
      .catch(error => {
          console.error("Error fetching dormitories:", error);
          toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" });
          setIsLoading(false);
      });
  }, [institution, toast]);

  const handleEdit = (dormitory: Dormitory) => {
    setEditingDormitory(dormitory);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDormitory(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (dormitoryId: string) => {
    try {
        await deleteDormitory(institution, dormitoryId);
        setDormitories(dormitories.filter((d) => d.id !== dormitoryId));
        toast({ title: "Sukses", description: I18N.successDelete });
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menghapus data.", variant: "destructive" });
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const dormitoryName = formData.get("name") as string;

    if (!dormitoryName) {
        toast({ title: "Gagal", description: I18N.errorEmpty, variant: "destructive" });
        return;
    }
    
    try {
        if (editingDormitory) {
            await updateDormitory(institution, editingDormitory.id, { name: dormitoryName });
            setDormitories(dormitories.map(d => d.id === editingDormitory.id ? {...d, name: dormitoryName } : d));
            toast({ title: "Sukses", description: I18N.successUpdate });
        } else {
            const newId = await addDormitory(institution, { name: dormitoryName });
            setDormitories([...dormitories, { id: newId, name: dormitoryName }]);
            toast({ title: "Sukses", description: I18N.successAdd });
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Gagal menyimpan data.", variant: "destructive" });
    } finally {
        setIsDialogOpen(false);
        setEditingDormitory(null);
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
    if (dormitories.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="text-center h-24">
            Tidak ada data untuk ditampilkan.
          </TableCell>
        </TableRow>
      );
    }
    return dormitories.map((d) => (
      <TableRow key={d.id}>
        <TableCell className="font-medium truncate max-w-[100px]">{d.id}</TableCell>
        <TableCell>{d.name}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
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
            <DialogTitle>{editingDormitory ? I18N.editTitle : I18N.addTitle}</DialogTitle>
            <DialogDescription>
              {editingDormitory ? I18N.editDesc : I18N.addDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input id="name" name="name" defaultValue={editingDormitory?.name} className="col-span-3" required />
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
