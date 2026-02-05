export enum MaterialType {
  MALT = 'MALT',
  HOPS = 'HOPS',
  YEAST = 'YEAST',
  ADJUNCT = 'ADJUNCT'
}

export interface RawMaterial {
  id: string;
  name: string;
  type: MaterialType;
  quantity: number; // kg for Malt/Adjunct, g for Hops
  unit: string;
  lotNumber: string;
  // Specific properties
  alphaAcid?: number; // For Hops
  generation?: number; // For Yeast
}

export interface Batch {
  id: string;
  recipeName: string;
  brewDate: string;
  conditioningDate?: string; // New: Start date of maturation phase
  tankId: string;
  status: 'Fermenting' | 'Conditioning' | 'Packaging' | 'Completed' | 'Empty';
  targetGravity: number;
  originalGravity: number;
  currentGravity: number;
  temperature: number; // Celsius
  ph: number;
  volume: number; // Current Liters inside (Liquid)
  capacity: number; // TANK TOTAL CAPACITY (Liters) - FIXED SIZE
  ingredients: {
    materialId: string;
    amount: number;
  }[];
  qualityControl?: {
    sensoryNotes: string; // "Aroma cítrico, cor dourada..."
    isApproved: boolean; // Se está no padrão ou não
    labNotes?: string; // Análises laboratoriais extras
    finalPh?: number;
    finalAbv?: number;
  };
}

export type ActionType = 'BREW' | 'KEG' | 'BOTTLE' | 'FINISH' | 'DISPATCH' | 'RETURN' | 'SALE';

export interface ProductionHistoryItem {
    id: string;
    date: string;
    actionType: ActionType;
    tankId: string;
    recipeName: string;
    volumeChanged: number; // Amount added or removed
    details: string; // Extra info (e.g. "Keg ID: 123", "OG: 1.050")
    
    // Detailed Batch Report Data (for FINISH actions)
    batchData?: {
        startDate: string;
        endDate: string;
        tankId: string;
        recipeSnapshot: {
            name: string;
            style: string;
            ingredients: {
                name: string;
                quantity: number;
                unit: string;
                type: string;
            }[];
        };
        qualityControl?: {
            sensoryNotes: string;
            isApproved: boolean;
            labNotes?: string;
            finalPh?: number;
            finalAbv?: number;
        };
    };
}

export interface Keg {
  id: string; // The unique QR code content
  capacity: number; // Fixed Total Size (e.g. 50L)
  batchId: string;
  recipeName: string; // Cached for dashboard performance
  fillDate: string;
  volume: number; // Liters usually 30L or 50L
  status: 'In-House' | 'Distributor' | 'Retail' | 'Empty' | 'Cleaning';
  customer?: string;
  locationHistory?: string[];
  dispatchDate?: string; // Date when it left the factory (starts shelf life count)
}

export interface BottleStock {
    recipeName: string;
    labelName?: string; // Optional Label Name (e.g. "IPA Lote 1 - Rótulo Preto")
    count: number; // Number of bottles
    volumePerBottle: number; // usually 0.6 (600ml) or 0.5
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}

export interface Recipe {
    id: string;
    name: string;
    style: string;
    baseVolume?: number; // Base volume for the recipe ingredients (e.g. 100L)
    og: number;
    fg: number;
    abv: string;
    ibu: number;
    shelfLife: number; // Days until expiry once packaged
    ingredients?: {
        materialId: string;
        name: string;
        type: MaterialType;
        quantity: number;
        unit: string;
    }[];
}