"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import type { InstitutionType } from '@/lib/types';

interface InstitutionContextType {
  institution: InstitutionType;
  setInstitution: (institution: InstitutionType) => void;
  isLoading: boolean;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export const InstitutionProvider = ({ children }: { children: React.ReactNode }) => {
  const [institution, setInstitution] = useState<InstitutionType>('formal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedInstitution = localStorage.getItem('institutionType');
      if (savedInstitution && (savedInstitution === 'formal' || savedInstitution === 'pesantren')) {
        setInstitution(savedInstitution);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleSetInstitution = (newInstitution: InstitutionType) => {
    try {
      localStorage.setItem('institutionType', newInstitution);
      setInstitution(newInstitution);
    } catch (error) {
       console.error("Could not access localStorage", error);
       setInstitution(newInstitution);
    }
  };

  const value = { institution, setInstitution: handleSetInstitution, isLoading };

  return (
    <InstitutionContext.Provider value={value}>
      {!isLoading && children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = (): InstitutionContextType => {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};
