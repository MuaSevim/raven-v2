import { create } from 'zustand';

export interface ShipmentDraft {
  // Step 1: Route - Origin
  originCountry: string;
  originCountryCode: string;
  originCity: string;

  // Step 1: Route - Destination
  destCountry: string;
  destCountryCode: string;
  destCity: string;
  destAirport: string;
  destAirportCode: string;

  // Step 2: Package Details
  weight: string;
  weightUnit: 'kg' | 'lb' | 'g';
  content: string;
  packageImageUri: string | null;

  // Step 3: Delivery Window
  dateStart: Date | null;
  dateEnd: Date | null;

  // Step 4: Pricing
  price: number;
  currency: string;

  // Step 5: Contact Details - Sender
  senderFullName: string;
  senderEmail: string;
  senderPhone: string;
  senderPhoneCode: string;
  senderCountryCode: string;

  // Step 5: Contact Details - Receiver (pickup at destination)
  receiverFullName: string;
  receiverPhone: string;
  receiverPhoneCode: string;
}

interface ShipmentStore {
  draft: ShipmentDraft;
  currentStep: number;
  totalSteps: number;

  // Actions
  setDraft: (data: Partial<ShipmentDraft>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetDraft: () => void;
}

const initialDraft: ShipmentDraft = {
  // Step 1 - Route
  originCountry: '',
  originCountryCode: '',
  originCity: '',
  destCountry: '',
  destCountryCode: '',
  destCity: '',
  destAirport: '',
  destAirportCode: '',

  // Step 2 - Package
  weight: '',
  weightUnit: 'kg',
  content: '',
  packageImageUri: null,

  // Step 3 - Dates
  dateStart: null,
  dateEnd: null,

  // Step 4 - Price
  price: 50,
  currency: 'USD',

  // Step 5 - Contact
  senderFullName: '',
  senderEmail: '',
  senderPhone: '',
  senderPhoneCode: '+1',
  senderCountryCode: 'US',
  receiverFullName: '',
  receiverPhone: '',
  receiverPhoneCode: '+1',
};

export const useShipmentStore = create<ShipmentStore>((set) => ({
  draft: initialDraft,
  currentStep: 1,
  totalSteps: 6,

  setDraft: (data) =>
    set((state) => ({
      draft: { ...state.draft, ...data },
    })),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  resetDraft: () =>
    set({
      draft: initialDraft,
      currentStep: 1,
    }),
}));

