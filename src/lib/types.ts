import type { Timestamp } from "firebase/firestore";

export type InstitutionType = 'formal' | 'pesantren';

export interface Student {
  id: string;
  name: string;
  classId: string;
  dormitory?: string; // Asrama
}

export interface Class {
  id: string;
  name: string;
  grade: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Dormitory {
  id: string;
  name: string;
}

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alfa";
export type RollCallStatus = "hadir" | "sakit" | "izin" | "alfa";


export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  status: AttendanceStatus;
  date: string; // YYYY-MM-DD
  classId: string;
}

// Used for Firestore operations
export interface AttendanceRecordFS {
  studentId: string;
  subjectId: string;
  status: AttendanceStatus;
  date: Timestamp;
  classId: string;
}

export interface RollCallRecord {
    id: string;
    studentId: string;
    status: RollCallStatus;
    date: string;
    notes?: string;
}
export interface RollCallRecordFS {
    studentId: string;
    status: RollCallStatus;
    date: Timestamp;
    notes?: string;
}


export interface MockData {
    classes: Class[];
    students: Student[];
    subjects: Subject[];
    attendance: AttendanceRecord[];
}

    