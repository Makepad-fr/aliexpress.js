import {ItemDetails} from "./item-details";

/**
 * The StoreDetails interface represents the base information about a Store
 * generally got from the item page
 */
export interface StoreDetails {
    name: string;
    followers: number;
    evalutationRate: number;
    url: string;
}

/**
 * The Store interface represents the complete Store details got from the Store details page
 */
export interface Store extends StoreDetails {
    items: ItemDetails[]
}