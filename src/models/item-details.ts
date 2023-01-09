import {StoreDetails} from "./store-details";

type Currency = 'EUR';
type ItemSize = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | number;

interface PriceDetails {
    original: number;
    discounted: number;
    currency: Currency
}


/**
 * The ItemDetails presents the thumbnail information in a item listing
 */
export interface ItemDetails {
    id: string;
    storeDetails: StoreDetails;
    title: string;
    sellCount: number;
    rating?: number | undefined;
    extraDiscount?: string | undefined; //TODO: Something like €2 offert dès € 25 d'achat
    shipping?: string | undefined; // TODO: Either livraison gratuit or nothing
    returnPrice?: string | undefined; // TODO: Retour gratuit
    thumbnailPhoto: ItemPhoto;
}

/**
 * An ItemPhoto represents a photo element associated to an item
 */
export interface ItemPhoto {
    id: string;
    itemId: string;
    path: string;
}

/**
 * Represents the stock information for an item
 */
export interface ItemStock {
    price: PriceDetails,
    size: ItemSize,
    color: string,
    availableItemCount: number;
    photo: ItemPhoto
}

/**
 * The Item represents the complete item information, therefor it's inherited from the ItemDetails interface
 */
export interface Item extends ItemDetails {
    sku: string;
    originalPhotos: ItemPhoto[];
    commentPhotos: ItemPhoto[];
    sizes: ItemSize[];
    colors: string[];
    commentsCount: number | undefined;
    ratersCount: number | undefined;
    stock: ItemStock[]
}
