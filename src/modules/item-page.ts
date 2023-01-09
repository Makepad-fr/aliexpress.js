import {ElementHandle, Page} from "playwright-core";
import {BASE_URL, MOBILE_BASE_URL} from "../constants";
import {ItemPhoto} from "../models/item-details";
import {basename} from 'path';
import {isElementPresent} from "../utils";

type PhotoDownloadFunction = (imageUrl: URL) => Promise<string>;
const MODERN_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR = "//div[contains(@class,'sumImageWrap')]";
const CLASSICAL_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR = "//div[contains(@class,'img-view-wrap')]";
const SKU_PROPERTY_ITEM_SELECTOR = "//div[contains(@class,'sku-wrap')]/div[contains(@class,'sku-property')]/ul[contains(@class, 'sku-property-list')]/li[contains(@class,'sku-property-item')]"

interface SaveActions {
    downloadDescriptionPhotos: PhotoDownloadFunction;
    downloadThumbnailPhotos: PhotoDownloadFunction;
    downloadCommentPhotos: PhotoDownloadFunction;
    // TODO: Add download thumbnail videos
}

export class AliExpressItemPage {

    readonly #id: string;
    readonly #url: string;
    readonly #mobileUrl: string;
    readonly #page: Page;
    readonly #mobilePage: Page;

    constructor(id: string, page: Page, mobilePage: Page) {
        this.#id = id;
        this.#url = `${BASE_URL}/item/${id}.html`;
        this.#mobileUrl = `${MOBILE_BASE_URL}/item/${id}.html`;
        this.#page = page;
        this.#mobilePage = mobilePage;
    }


    /**
     * Navigates to the item details page if necassary
     * @returns Returns nothing
     */
    async init(): Promise<void> {
        if (this.#page.url() !== this.#url) {
            await this.#page.goto(this.#url);
        }
        if (this.#mobilePage.url() !== this.#mobileUrl) {
            await this.#mobilePage.goto(this.#mobileUrl);
        }

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    async save(actions: SaveActions) {


        // TODO: Get comments with photos and download photos (selectors are different in modern stores and classical stores
        // TODO: Get item price
        // TODO: Get colors //div[contains(@class,'sku-property')]/ul[contains(@class,'sku-property-list')]/li[contains(@class,'sku-property-item')]
        // TODO: Get sizes
        // TODO: Get shipping information
        // TODO: Get not discounted price
        // TODO: Get store name and url
        // TODO: Download video content (once again, there's two different store type)
        // TODO: Check if there's videos in comments
        await Promise.all([
                this.getItemThumbnailPhotos(actions.downloadThumbnailPhotos),
                this.getItemDescriptionPhotos(actions.downloadDescriptionPhotos),
                this.getCommentPhotos(actions.downloadCommentPhotos)
            ]
        );
        // TODO: Call on save function which is an class attribute;
    }


    /**
     * Get the photos from the item page thumbnails
     * @param download The callback function to handle download of the photos
     */
    async getItemThumbnailPhotos(download: PhotoDownloadFunction): Promise<ItemPhoto[]> {
        const isModernStoreView = await this.#hasModernStoreView();
        const isClassicalStoreView = await this.#hasClassicalStoreView();
        if (!isClassicalStoreView && !isModernStoreView) {
            throw new Error('Current has neither modern nor classical store view');
        }
        let thumbnailImageSelector: string;
        if (await this.#hasModernStoreView()) {
            console.log('Modern store view');
            thumbnailImageSelector = `${MODERN_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR}/div[contains(@class,'sumImage')]/div[contains(@class,'productImageWrap')]/img[contains(@class,'productImage')]`;
        } else {
            console.log('Classical store view');
            // We know that if the store has not the modern view, it has the classical view
            thumbnailImageSelector = `${CLASSICAL_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR}//ul[contains(@class, 'images-view-list')]/li/div[contains(@class, 'images-view-item')]/img`;
        }
        let thumbnailPhotos = await this.#page.$$(thumbnailImageSelector);
        console.debug(`Thumbnail photos selector ${thumbnailImageSelector}`);
        console.log(`Number of thumbnail photos ${thumbnailPhotos.length}`);
        const photos: ItemPhoto[] = [...await getThumbnailPhotos(thumbnailPhotos, download, this.#id)];
        if (isClassicalStoreView) {
            thumbnailImageSelector = `${SKU_PROPERTY_ITEM_SELECTOR}/div[contains(@class,'sku-property-image')]/img`;
            thumbnailPhotos = await this.#page.$$(thumbnailImageSelector);
            console.log(`SKU property with photos count ${thumbnailPhotos.length}`);
            photos.push(...(await getThumbnailPhotos(thumbnailPhotos, download, this.#id)));
        }
        return photos;
    }

    async getCommentPhotos(download: PhotoDownloadFunction): Promise<ItemPhoto[]> {
        const reviewsRatingSelector = "//div[contains(@class,'reviews--rating')]";
        const scrollPanelSelector = '//div[contains(@class,"scroll-panel-content")]';

        await scrollUntilElementAppears(this.#mobilePage, reviewsRatingSelector);
        const reviewsRatingElement = await this.#mobilePage.$(reviewsRatingSelector);
        await reviewsRatingElement!.evaluate((node) => node.scrollIntoView({block: 'end', behavior: "smooth"}));
        console.log("Scrolled into the view");
        await this.#mobilePage.click(reviewsRatingSelector);
        console.log('Clicked on reviews');
        await this.#mobilePage.waitForSelector(scrollPanelSelector);
        console.log('Scroll panel appeared');
        const scrollPanel = await this.#mobilePage.$(scrollPanelSelector);
        await scrollElementCompletely(this.#mobilePage, scrollPanel!);
        console.log('ELEMENT COMPLETELY SCROLLED!!');
        while (!await isElementPresent(this.#mobilePage, "//div[contains(@class,'view-more') and contains(@class, 'disabled')]")) {
            await this.#mobilePage.click("//div[contains(@class,'view-more')]");
            console.log('CLICKED ON EXPAND BUTTON')
            console.log('Expanding more comments');
            await scrollElementCompletely(this.#mobilePage, scrollPanel!);
        }
        const commentImageSelector = "//img[contains(@class,'review-card--thumbinail')]";
        const commentImageElements = await this.#mobilePage.$$(commentImageSelector);
        const photos: ItemPhoto[] = [];
        for (const commentImageElement of commentImageElements) {
            let commentImageSrc = await commentImageElement.getAttribute('src');
            if (commentImageSrc === undefined) {
                console.error('Found a comment image without src attribute');
                continue;
            }
            if (!commentImageSrc!.startsWith('https:')) {
                // Include https: manually
                commentImageSrc = `https:${commentImageSrc}`;
            }
            const commentImageSrcURL = new URL(stripThumbnailPhotoSrcURL(commentImageSrc!));
            const downloadedCommentImagePath: string = await download(commentImageSrcURL);
            photos.push({
                id: basename(commentImageSrcURL.pathname),
                itemId: this.#id,
                path: downloadedCommentImagePath
            })
        }
        return photos;
    }


    /**
     * Check if the store has the modern store view/
     * @see https://fr.aliexpress.com/item/1005003376501830.html
     * @private
     */
    async #hasModernStoreView(): Promise<boolean> {
        try {
            await this.#page.waitForSelector(MODERN_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if the current store has classical store view.
     * @see https://fr.aliexpress.com/item/1005004658468846.html
     * @private
     */
    async #hasClassicalStoreView(): Promise<boolean> {
        try {
            await this.#page.waitForSelector(CLASSICAL_STORE_IMAGE_PREVIEW_CONTAINER_SELECTOR);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the photos from the item description
     * @param downloadPhoto Callback function used to handle photos got from the image description
     */
    async getItemDescriptionPhotos(downloadPhoto: PhotoDownloadFunction) {
        await scrollUntilTheEndOfPage(this.#page);
        const photoElems = await this.#page.$$("//div[contains(@class,'detailmodule_html')]/div[contains(@class,'detail-desc-decorate-richtext')]/div[contains(@class,'detailmodule_image')]/img");
        console.log(`Number of photo elements ${photoElems.length}`);
        const photos: ItemPhoto[] = [];
        for (const photoElem of photoElems) {
            const photoLink = await photoElem.getAttribute('src');
            if (photoLink === undefined) {
                console.error('Found an image element without the src attribute');
                continue;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const url = new URL(photoLink!);
            const downloadedPhotoPath = await downloadPhoto(url);
            photos.push({
                path: downloadedPhotoPath,
                itemId: this.#id,
                id: basename(url.pathname)
            });
        }
        return photos;
    }
}

async function scrollUntilElementAppears(page: Page, selector: string): Promise<void> {
    let scrollDelta = 0;
    let remainingScrollableHeight = await getScrollableHeight(page);
    let remainingScrollPercentage = 100;
    do {
        const scrollFactor = getScrollFactor();
        const height = remainingScrollableHeight * scrollFactor;
        scrollDelta += height;
        await scroll(page, scrollDelta);
        console.log(`Scrolled by ${height}`);
        const duration = Math.ceil(Math.random() * 5000 + 1000);
        console.info(`Will wait for ${duration}`);
        await page.waitForTimeout(duration);
        remainingScrollableHeight = await getScrollableHeight(page) - scrollDelta;
        console.info(`Remaining scrollable height: ${remainingScrollableHeight}`);
        remainingScrollPercentage = remainingScrollableHeight / (await getScrollableHeight(page)) * 100;
    } while (remainingScrollPercentage >= 2 && !(await isElementPresent(page, selector)));
}

/**
 * Scroll until the page can not be scrollable anymore
 */
async function scrollUntilTheEndOfPage(page: Page): Promise<void> {
    let scrollDelta = 0;
    let remainingScrollableHeight = await getScrollableHeight(page);
    let remainingScrollPercentage = 100;
    do {
        const scrollFactor = getScrollFactor();
        const height = remainingScrollableHeight * scrollFactor;
        scrollDelta += height;
        await scroll(page, scrollDelta);
        console.log(`Scrolled by ${height}`);
        const duration = Math.ceil(Math.random() * 5000 + 1000);
        console.info(`Will wait for ${duration}`);
        await page.waitForTimeout(duration);
        remainingScrollableHeight = await getScrollableHeight(page) - scrollDelta;
        console.info(`Remaining scrollable height: ${remainingScrollableHeight}`);
        remainingScrollPercentage = remainingScrollableHeight / (await getScrollableHeight(page)) * 100;
    } while (remainingScrollPercentage >= 2);
}

async function scrollElementCompletely(page: Page, element: ElementHandle<HTMLElement | SVGElement>): Promise<void> {
    let scrollDelta = 0;
    let remainingScrollableHeight = await getElementScrollHeight(page, element);
    while (!(await isElementTotallyScrolled(page, element))) {
        const scrollFactor = getScrollFactor();
        const height = remainingScrollableHeight * scrollFactor;
        scrollDelta += height;
        await scrollElement(element);
        const duration = Math.ceil(Math.random() * 5000 + 1000);
        await page.waitForTimeout(duration);
        remainingScrollableHeight = await getScrollableHeight(page) - scrollDelta;
    }
}

async function isElementTotallyScrolled(page: Page, element: ElementHandle<SVGElement | HTMLElement>): Promise<boolean> {
    return page.evaluate((e) => Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop) < 1, element);
}

async function getElementScrollHeight(page: Page, element: ElementHandle<HTMLElement | SVGElement>): Promise<number> {
    return page.evaluate(e => e.scrollHeight, element);
}

/**
 * Get the scrollable height of the current page
 * @private
 * @returns The scrollable height of the current page
 */
async function getScrollableHeight(page: Page): Promise<number> {
    return page.evaluate(() => document.body.scrollHeight);
}

/**
 * Scroll the page by the given number of pixels
 * @param by Scroll the page with the given number of pixels
 * @private
 */
async function scroll(page: Page, by: number) {
    return page.evaluate((n) => window.scroll(0, n), by);
}

/**
 * Return the number scroll factor
 */
function getScrollFactor() {
    let scrollFactor: number;
    do {
        scrollFactor = Math.random()
    } while (scrollFactor >= 0.25);
    return scrollFactor;
}

/**
 * Remove the resize parameters from the thumbnail image source URL
 * @param thumbnailImageSrc The URL of the thumbnail image
 * @returns The stripped thumbnail image source URL
 */
function stripThumbnailPhotoSrcURL(thumbnailImageSrc: string): string {
    return thumbnailImageSrc!.replace(/(^.*\/[^/.]+\.(jpe?g|png))[^/]*$/g, '$1');
}

async function scrollElement(element: ElementHandle<SVGElement | HTMLElement>) {
    await element.evaluate((node) => node.scrollBy(0, node.scrollHeight));
}

async function getThumbnailPhotos(thumbnailPhotos: ElementHandle<SVGElement | HTMLElement>[], download: PhotoDownloadFunction, itemId: string) {
    const photos: ItemPhoto[] = [];
    for (const thumbnailPhoto of thumbnailPhotos) {
        let thumbnailImageSrc = await thumbnailPhoto.getAttribute('src');
        if (thumbnailImageSrc === undefined) {
            console.error('Found a thumbnail image without the src attribute');
            continue;
        }
        thumbnailImageSrc = stripThumbnailPhotoSrcURL(thumbnailImageSrc!);
        const thumbnailImageSrcURL = new URL(thumbnailImageSrc);
        const savedThumbnailImagePath = await download(thumbnailImageSrcURL);
        photos.push({
            id: basename(thumbnailImageSrcURL.pathname),
            itemId,
            path: savedThumbnailImagePath
        })
    }
    return photos;
}
