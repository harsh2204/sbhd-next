// Import the new modular card systems
import { 
  ENGLISH_GAME_CARDS, 
  ENGLISH_DECEASED_NAMES, 
  ENGLISH_THEMATIC_ESTATES, 
  ENGLISH_IDENTITY_ESTATE_MAPPING,
  generateDeceased as generateEnglishDeceased,
  drawRandomCard as drawEnglishCard
} from './gameCards/english';

import { 
  DESI_GAME_CARDS as IMPORTED_DESI_GAME_CARDS, 
  DESI_DECEASED_NAMES as IMPORTED_DESI_DECEASED_NAMES, 
  DESI_THEMATIC_ESTATES as IMPORTED_DESI_THEMATIC_ESTATES, 
  DESI_IDENTITY_ESTATE_MAPPING as IMPORTED_DESI_IDENTITY_ESTATE_MAPPING,
  generateDeceased as generateDesiDeceased,
  drawRandomCard as drawDesiCard
} from './gameCards/desi';

// Legacy exports for backward compatibility
export const GAME_CARDS = ENGLISH_GAME_CARDS;
export const DESI_GAME_CARDS = IMPORTED_DESI_GAME_CARDS;
export const DECEASED_NAMES = ENGLISH_DECEASED_NAMES;
export const DESI_DECEASED_NAMES = IMPORTED_DESI_DECEASED_NAMES;
export const THEMATIC_ESTATES = ENGLISH_THEMATIC_ESTATES;
export const DESI_THEMATIC_ESTATES = IMPORTED_DESI_THEMATIC_ESTATES;
export const IDENTITY_ESTATE_MAPPING = ENGLISH_IDENTITY_ESTATE_MAPPING;
export const DESI_IDENTITY_ESTATE_MAPPING = IMPORTED_DESI_IDENTITY_ESTATE_MAPPING;

export type CardType = 'identity' | 'relationship' | 'backstory' | 'objection';

export function drawRandomCard(type: CardType, usedCards: string[] = [], isDesi: boolean = false): string {
  if (isDesi) {
    return drawDesiCard(type, usedCards);
  } else {
    return drawEnglishCard(type, usedCards);
  }
}

export function generateDeceased(isDesi: boolean = false) {
  if (isDesi) {
    return generateDesiDeceased();
  } else {
    return generateEnglishDeceased();
  }
}

// Helper functions for estate management
export function addEstateItem(estateItems: string[], newItem: string): string[] {
  return [...estateItems, newItem];
}

export function removeEstateItem(estateItems: string[], itemIndex: number): string[] {
  return estateItems.filter((_, index) => index !== itemIndex);
}

export function getEstateItemsForDisplay(estateItems: string[], isEstateKeeper: boolean): string[] {
  // Estate Keeper sees all items, others see only first 3-5 items as "summary"
  return isEstateKeeper ? estateItems : estateItems.slice(0, Math.min(4, estateItems.length));
} 
