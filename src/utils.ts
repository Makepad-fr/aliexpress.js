import { SHA1 } from "crypto-js";
import { Browser, BrowserContext, BrowserType, Page } from "playwright-core";
import { existsSync } from 'fs';

/**
 * Gets the filename of the saved browser context path
 * @param id The browser context identifier string used for the browser context identifier name
 * @returns The filename of the saved browser context path
 */
export function getBrowserContextFilePath(id: string|undefined): string|undefined {
    return id === undefined? undefined: `aliexpress_${id}.json`;
}

/**
 * Get the browser context identifier from given user details
 * @param username The username of the account used to created the saved browser context path
 * @param password The password of the account used for creating the browser context path
 */
export function getBrowserContextIdentifier(browserType: BrowserType, username: string, password:string): string {
    const bt = SHA1(browserType.name()).toString();
    const u = SHA1(username).toString();
    const p = SHA1(password).toString();
    return `${bt}_${u}_${p}`;
}

/**
 * Check if the given browser context file exists in the given file path
 * @param filePath The path of the browser context file
 * @returns True if the browserr context file exists in the given path, false if not
 */
export function isBrowserContextExists(filePath: string|undefined): boolean {
    return filePath === undefined ? false : existsSync(filePath);
}

/**
 * Loads the browser context path and return the authenticated contexts
 * @param browser The browser on which the browser context path will be loaded
 * @param contextFilePath The path of the browser context file to load
 * @returns Browser context with the browser context path loaded
 */
export async function loadBrowserContextPath(browser: Browser, contextFilePath: string): Promise<BrowserContext> {
    return browser.newContext({storageState: contextFilePath});
}

/**
 * Save the current browser context to the given file path
 * @param context The browser context that will be saved
 * @param contextFilePath The path of the context file
 */
export async function saveBrowserContextPath(context: BrowserContext, contextFilePath: string) {
    await context.storageState({ path: contextFilePath });
}

/**
 * Wait for cookies banner and accept it if it appears
 * @param page The page on which cookies will be accepted
 * @returns Returns nothing
 */
export async function acceptCookies(page: Page) {
    try {
        await page.waitForSelector("//div[@class='global-gdpr-btn-wrap']");
        await page.click("//div[@class='global-gdpr-btn-wrap']/button[@class='btn-accept']");
    } catch {return;}
}

/**
 * Check if the given element is present on the given page or not
 * @param page The page on which we'll check the presence of the element
 * @param selector The selector to check the presence for
 * @returns True if the given element is present on the given page, false if not
 */
export async function isElementPresent(page: Page, selector: string): Promise<boolean> {
    try {
        await page.waitForSelector(selector);
        console.log('Selector appeared');
        return true;
    } catch {
        return false;
    }
}

export type Consumer<T> = (o: T) => void;
