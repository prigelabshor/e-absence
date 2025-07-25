
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Student, RollCallStatus } from "@/lib/types";
import { useInstitution } from "@/context/institution-context";
import { getStudents, saveRollCall } from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PermitLeavePage() {
    const { institution } = useInstitution();
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDormitory, setSelectedDormitory] = useState<string | undefined>();
    const [selectedStudent, setSelectedStudent] = useState<string | undefined>();
    const [notes, setNotes] = useState("");

    useEffect(() => {
        setIsLoading(true);
        getStudents(institution).then(data => {
            setStudents(data);
            setIsLoading(false);
        }).catch(error => {
            console.error(error);
            toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" });
            setIsLoading(false);
        });
    }, [institution, toast]);
    
    const dormitories = useMemo(() => {
        const dorms = students
            .map(s => s.dormitory)
            .filter((d, index, self) => d && self.indexOf(d) === index);
        return dorms as string[];
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!selectedDormitory) return [];
        return students.filter(s => s.dormitory === selectedDormitory);
    }, [students, selectedDormitory]);

    const handleDormitoryChange = (dormitory: string) => {
        setSelectedDormitory(dormitory);
        setSelectedStudent(undefined);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedStudent || !selectedDormitory) {
            toast({ title: "Error", description: "Silakan pilih asrama dan siswa/santri.", variant: "destructive"});
            return;
        }

        setIsLoading(true);
        const record = {
            studentId: selectedStudent,
            status: 'izin' as RollCallStatus,
            notes: notes
        };

        try {
            await saveRollCall(institution, [record]);
            toast({ title: "Sukses", description: "Catatan izin berhasil disimpan." });
            setSelectedStudent(undefined);
            setSelectedDormitory(undefined);
            setNotes("");
        } catch (error) {
            console.error("Error saving leave permit:", error);
            toast({ title: "Error", description: "Gagal menyimpan catatan.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Catat Izin</h1>
                <p className="text-muted-foreground">
                    Catat siswa atau santri yang mendapatkan izin.
                </p>
            </div>

            <Card className="max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Form Izin</CardTitle>
                    <CardDescription>Pilih asrama, kemudian pilih siswa/santri dan tambahkan keterangan jika perlu.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label>Asrama / Kamar</Label>
                             <Select value={selectedDormitory} onValueChange={handleDormitoryChange} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih asrama..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {dormitories.map(dorm => (
                                        <SelectItem key={dorm} value={dorm}>
                                            {dorm}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Siswa / Santri</Label>
                             <Select value={selectedStudent} onValueChange={setSelectedStudent} required disabled={!selectedDormitory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih nama..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredStudents.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name} ({student.classId})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Keterangan (Opsional)</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Misal: Pulang, keperluan keluarga, dll."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                         <Button type="submit" className="w-full" disabled={isLoading || !selectedStudent}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Catatan Izin
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
