import { create } from 'zustand';

export interface SignupData {
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  country: string;
  countryCode: string;
  city: string;
  email: string;
  password: string;
}

interface SignupStore {
  currentStep: number;
  data: SignupData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<SignupData>) => void;
  reset: () => void;
}

const initialData: SignupData = {
  firstName: '',
  lastName: '',
  birthDay: 0,
  birthMonth: 0,
  birthYear: 0,
  country: '',
  countryCode: '',
  city: '',
  email: '',
  password: '',
};

export const useSignupStore = create<SignupStore>((set) => ({
  currentStep: 1,
  data: initialData,
  
  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 5) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
  
  updateData: (updates) => set((state) => ({
    data: { ...state.data, ...updates }
  })),
  
  reset: () => set({ currentStep: 1, data: initialData }),
}));
