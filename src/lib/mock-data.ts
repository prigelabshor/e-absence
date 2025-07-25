
// This file is no longer used for providing data to the application.
// It is kept for reference or potential future use if needed.
// All data operations are now handled by firestore-service.ts which interacts with Firebase Firestore.
import type { Class, Student, Subject, AttendanceRecord, MockData, InstitutionType } from "@/lib/types";
import { subDays, format } from 'date-fns';

// --- DATA SEKOLAH FORMAL ---
const formalClasses: Class[] = [
  { id: "C101", name: "X IPA 1", grade: "10" },
  { id: "C102", name: "X IPS 2", grade: "10" },
  { id: "C201", name: "XI IPA 3", grade: "11" },
  { id: "C202", name: "XI IPS 1", grade: "11" },
  { id: "C301", name: "XII IPA 2", grade: "12" },
];

const formalStudents: Student[] = [
  // Class C101
  { id: "S001", name: "Ahmad Dahlan", classId: "C101" },
  { id: "S002", name: "Budi Santoso", classId: "C101" },
  { id: "S003", name: "Citra Lestari", classId: "C101" },
  { id: "S004", name: "Dewi Anggraini", classId: "C101" },
  { id: "S005", name: "Eko Prasetyo", classId: "C101" },
  // Class C102
  { id: "S006", name: "Fitriani", classId: "C102" },
  { id: "S007", name: "Gunawan", classId: "C102" },
];

const formalSubjects: Subject[] = [
    { id: "SUB01", name: "Matematika" },
    { id: "SUB02", name: "Fisika" },
    { id: "SUB03", name: "Sejarah Indonesia" },
    { id: "SUB04", name: "Bahasa Inggris" },
];

const today = new Date();
const yesterday = subDays(today, 1);
const twoDaysAgo = subDays(today, 2);

const formalAttendance: AttendanceRecord[] = [
    { studentId: "S001", subjectId: "SUB01", status: "hadir", date: format(today, "yyyy-MM-dd")},
    { studentId: "S002", subjectId: "SUB01", status: "sakit", date: format(today, "yyyy-MM-dd")},
    { studentId: "S003", subjectId: "SUB01", status: "hadir", date: format(today, "yyyy-MM-dd")},
    { studentId: "S001", subjectId: "SUB04", status: "hadir", date: format(yesterday, "yyyy-MM-dd")},
    { studentId: "S006", subjectId: "SUB03", status: "izin", date: format(yesterday, "yyyy-MM-dd")},
    { studentId: "S007", subjectId: "SUB03", status: "alfa", date: format(yesterday, "yyyy-MM-dd")},
];


// --- DATA PESANTREN ---
const pesantrenClasses: Class[] = [
  { id: "H101", name: "Halaqah Al-Fatihah", grade: "Ula" },
  { id: "H102", name: "Halaqah Al-Ikhlas", grade: "Ula" },
  { id: "H201", name: "Halaqah An-Nas", grade: "Wustha" },
];

const pesantrenStudents: Student[] = [
  { id: "P001", name: "Abdullah bin Mas'ud", classId: "H101" },
  { id: "P002", name: "Zaid bin Tsabit", classId: "H101" },
  { id: "P003", name: "Fatimah az-Zahra", classId: "H102" },
  { id: "P004", name: "Umar bin Khattab", classId: "H201" },
  { id: "P005", name: "Aisyah binti Abu Bakar", classId: "H201" },
];

const pesantrenSubjects: Subject[] = [
    { id: "KIT01", name: "Aqidatul Awam" },
    { id: "KIT02", name: "Safinatun Najah" },
    { id: "KIT03", name: "Tijan ad-Darori" },
    { id: "KIT04", name: "Fathul Qorib" },
];

const pesantrenAttendance: AttendanceRecord[] = [
    { studentId: "P001", subjectId: "KIT01", status: "hadir", date: format(today, "yyyy-MM-dd")},
    { studentId: "P002", subjectId: "KIT01", status: "izin", date: format(today, "yyyy-MM-dd")},
    { studentId: "P004", subjectId: "KIT04", status: "hadir", date: format(yesterday, "yyyy-MM-dd")},
    { studentId: "P005", subjectId: "KIT04", status: "sakit", date: format(yesterday, "yyyy-MM-dd")},
];

const mockData: Record<InstitutionType, MockData> = {
    formal: {
        classes: formalClasses,
        students: formalStudents,
        subjects: formalSubjects,
        attendance: formalAttendance,
    },
    pesantren: {
        classes: pesantrenClasses,
        students: pesantrenStudents,
        subjects: pesantrenSubjects,
        attendance: pesantrenAttendance,
    }
}

export const getMockData = (type: InstitutionType): MockData => {
    return mockData[type];
}
