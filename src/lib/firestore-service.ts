import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  writeBatch,
  Timestamp,
  type CollectionReference
} from 'firebase/firestore';
import type {
  InstitutionType,
  Class,
  Student,
  Subject,
  Dormitory,
  AttendanceStatus,
  AttendanceRecord,
  AttendanceRecordFS,
  RollCallStatus,
  RollCallRecord,
  RollCallRecordFS
} from './types';
import { format } from 'date-fns';

// Helper to get the correct collection reference for an institution
const getCollectionRef = (
  institution: InstitutionType,
  collectionName: string
): CollectionReference => {
  // Each institution type ('formal', 'pesantren') is a document in the top-level 'institutions' collection.
  // The actual data collections ('classes', 'students', etc.) are sub-collections within that institution's document.
  return collection(doc(db, 'institutions', institution), collectionName);
};

// --- Class Services ---

export const getClasses = async (institution: InstitutionType): Promise<Class[]> => {
  const q = query(getCollectionRef(institution, 'classes'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
};

export const getClassById = async (institution: InstitutionType, id: string): Promise<Class | null> => {
  const docRef = doc(getCollectionRef(institution, 'classes'), id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Class) : null;
};

export const addClass = async (institution: InstitutionType, classData: Omit<Class, 'id'>): Promise<string> => {
  const docRef = await addDoc(getCollectionRef(institution, 'classes'), classData);
  return docRef.id;
};

export const updateClass = async (institution: InstitutionType, id: string, classData: Partial<Omit<Class, 'id'>>): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'classes'), id);
  await updateDoc(docRef, classData);
};

export const deleteClass = async (institution: InstitutionType, id: string): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'classes'), id);
  await deleteDoc(docRef);
};

// --- Student Services ---

export const getStudents = async (institution: InstitutionType): Promise<Student[]> => {
  const q = query(getCollectionRef(institution, 'students'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getStudentsByClass = async (institution: InstitutionType, classId: string): Promise<Student[]> => {
  const q = query(getCollectionRef(institution, 'students'), where('classId', '==', classId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const addStudent = async (institution: InstitutionType, studentData: Omit<Student, 'id'>): Promise<string> => {
  const docRef = await addDoc(getCollectionRef(institution, 'students'), studentData);
  return docRef.id;
};

export const addMultipleStudents = async (
  institution: InstitutionType,
  studentsData: Omit<Student, 'id'>[]
): Promise<string[]> => {
  const batch = writeBatch(db);
  const newIds: string[] = [];
  const studentsCollection = getCollectionRef(institution, 'students');

  studentsData.forEach(student => {
    const docRef = doc(studentsCollection);
    batch.set(docRef, student);
    newIds.push(docRef.id);
  });

  await batch.commit();
  return newIds;
};

export const updateStudent = async (
  institution: InstitutionType,
  id: string,
  studentData: Partial<Omit<Student, 'id'>>
): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'students'), id);
  await updateDoc(docRef, studentData);
};

export const deleteStudent = async (institution: InstitutionType, id: string): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'students'), id);
  await deleteDoc(docRef);
};

// --- Subject Services ---

export const getSubjects = async (institution: InstitutionType): Promise<Subject[]> => {
  const q = query(getCollectionRef(institution, 'subjects'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};

export const addSubject = async (
  institution: InstitutionType,
  subjectData: Omit<Subject, 'id'>
): Promise<string> => {
  const docRef = await addDoc(getCollectionRef(institution, 'subjects'), subjectData);
  return docRef.id;
};

export const updateSubject = async (
  institution: InstitutionType,
  id: string,
  subjectData: Partial<Omit<Subject, 'id'>>
): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'subjects'), id);
  await updateDoc(docRef, subjectData);
};

export const deleteSubject = async (institution: InstitutionType, id: string): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'subjects'), id);
  await deleteDoc(docRef);
};

// --- Dormitory Services ---
export const getDormitories = async (institution: InstitutionType): Promise<Dormitory[]> => {
  const q = query(getCollectionRef(institution, 'dormitories'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dormitory));
};

export const addDormitory = async (
  institution: InstitutionType,
  dormitoryData: Omit<Dormitory, 'id'>
): Promise<string> => {
  const docRef = await addDoc(getCollectionRef(institution, 'dormitories'), dormitoryData);
  return docRef.id;
};

export const updateDormitory = async (
  institution: InstitutionType,
  id: string,
  dormitoryData: Partial<Omit<Dormitory, 'id'>>
): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'dormitories'), id);
  await updateDoc(docRef, dormitoryData);
};

export const deleteDormitory = async (institution: InstitutionType, id: string): Promise<void> => {
  const docRef = doc(getCollectionRef(institution, 'dormitories'), id);
  await deleteDoc(docRef);
};

// --- Attendance Services ---

export const saveAttendance = async (
  institution: InstitutionType,
  classId: string,
  subjectId: string,
  attendance: Record<string, AttendanceStatus>
): Promise<void> => {
  const batch = writeBatch(db);
  const today = new Date();
  const date = Timestamp.fromDate(today);
  const attendanceCollection = getCollectionRef(institution, 'attendance');

  Object.entries(attendance).forEach(([studentId, status]) => {
    const docRef = doc(attendanceCollection);
    const record: Omit<AttendanceRecordFS, 'id'> = {
      studentId,
      classId,
      subjectId,
      status,
      date
    };
    batch.set(docRef, record);
  });

  await batch.commit();
};

export const getAllAttendanceForRecap = async (
  institution: InstitutionType,
  startDate: Date,
  endDate: Date
): Promise<AttendanceRecord[]> => {
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const q = query(
    getCollectionRef(institution, 'attendance'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as AttendanceRecordFS;
    return {
      ...data,
      id: doc.id,
      date: format(data.date.toDate(), 'yyyy-MM-dd')
    } as AttendanceRecord;
  });
};

export const getAttendanceForRecap = async (
  institution: InstitutionType,
  classId: string,
  startDate: Date,
  endDate: Date
): Promise<AttendanceRecord[]> => {
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const q = query(
    getCollectionRef(institution, 'attendance'),
    where('classId', '==', classId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as AttendanceRecordFS;
    return {
      ...data,
      id: doc.id,
      date: format(data.date.toDate(), 'yyyy-MM-dd')
    } as AttendanceRecord;
  });
};

// --- Roll Call (Apel) Services ---

export const saveRollCall = async (
    institution: InstitutionType,
    records: { studentId: string; status: RollCallStatus; notes?: string }[]
): Promise<void> => {
    const batch = writeBatch(db);
    const today = new Date();
    const date = Timestamp.fromDate(today);
    const rollCallCollection = getCollectionRef(institution, 'roll_call_attendance');

    records.forEach(({ studentId, status, notes }) => {
        const docRef = doc(rollCallCollection);
        const record: Omit<RollCallRecordFS, 'id'> = {
            studentId,
            status,
            date,
            notes: notes || "", // Ensure notes is always defined
        };
        batch.set(docRef, record);
    });

    await batch.commit();
};

export const getRollCallForRecap = async (
  institution: InstitutionType,
  startDate: Date,
  endDate: Date
): Promise<RollCallRecord[]> => {
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const q = query(
    getCollectionRef(institution, 'roll_call_attendance'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as RollCallRecordFS;
    return {
      ...data,
      id: doc.id,
      date: format(data.date.toDate(), 'yyyy-MM-dd')
    } as RollCallRecord;
  });
};
