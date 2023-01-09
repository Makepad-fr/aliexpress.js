import {
    Browser,
    BrowserContext,
    BrowserContextOptions,
    BrowserType,
    firefox,
    LaunchOptions,
    Page
} from "playwright-core";
import {BASE_URL} from "./constants";
import {AliExpressItemPage} from "./modules/item-page";
import {
    acceptCookies,
    getBrowserContextFilePath,
    getBrowserContextIdentifier,
    isBrowserContextExists,
    loadBrowserContextPath,
    saveBrowserContextPath
} from "./utils";

interface UserCredentials {
    username: string;
    password: string;
    rememberMe?: boolean | true;
}

interface AliExpressOptions {
    browserType?: BrowserType;
    launchOptions?: LaunchOptions;
    browserContextOptions?: BrowserContextOptions;
    userCredentials?: UserCredentials | undefined;
}

export default class AliExpress {

    private browser!: Browser;
    private mobileBrowser!: Browser;
    private page!: Page;
    private browserContext!: BrowserContext;
    private mobileBrowserContext!: BrowserContext;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private mobilePage!: Page;

    /**
     * Initialize the AliExpress module with given configuration options
     * @param options options for launching AliExpress module
     */
    async init({
                   browserType,
                   launchOptions,
                   browserContextOptions,
                   userCredentials
               }: AliExpressOptions) {
        const bt = browserType ?? firefox;
        browserContextOptions = browserContextOptions ?? {};
        launchOptions = launchOptions ?? {};
        this.browser = await bt.launch(launchOptions);
        this.mobileBrowser = await bt.launch(launchOptions);
        if (userCredentials !== undefined && !(await this.#loadBrowserContextPath(userCredentials!.username, userCredentials!.password))) {
            await this.page.goto(BASE_URL);
            this.browserContext = await this.browser.newContext(browserContextOptions);
            this.mobileBrowserContext = await this.mobileBrowser.newContext(browserContextOptions);
            this.page = await this.browserContext.newPage();
            this.mobilePage = await this.mobileBrowserContext.newPage();
            await acceptCookies(this.page);
            console.log('Accepted cookies');
            this.page = await this.browserContext.newPage();
            await this.#login(userCredentials!.username, userCredentials!.password, userCredentials!.rememberMe);
        }

    }

    /**
     * Login the given user with username and password
     * @param username The username of the account to login with
     * @param password The password of the account to login with
     * @param rememberMe A boolean indicates that if the login information should be saved or not. By default it's set to true
     */
    async #login(username: string, password: string, rememberMe = true) {
        if (await this.#loadBrowserContextPath(username, password)) {
            return;
        }
        console.log(`Username: ${username}, password: ${password} remember me? ${rememberMe}`);
        await this.page.click("//a[@data-role='myaliexpress-link']");
        console.log('Clicked on my account link');
        await this.page.click("//a[@data-role='sign-link']");
        console.log('Clicked on sign in link');
        await this.page.focus("//input[@id='fm-login-id']");
        await this.page.keyboard.type(username);
        console.log('Username typed');
        await this.page.focus("//input[@id='fm-login-password']");
        await this.page.keyboard.type(password);
        console.log('Password typed');
        await this.page.click("//button[contains(@class,'login-submit')]");
        console.log('Clicked on submit button');
        // TODO: Handle invalid login credentials
        await this.page.waitForNavigation();
        if (rememberMe) {
            await this.#saveBrowserContextPath(username, password);
        }
    }


    /**
     * Save the browser context path with given parameters
     * @param username The username of the authenticated user
     * @param password The password of the authenticated user
     */
    async #saveBrowserContextPath(username: string, password: string) {
        const browserContextId = getBrowserContextIdentifier(this.browser.browserType(), username, password);
        const browserContextFilePath = getBrowserContextFilePath(browserContextId);
        if (browserContextFilePath === undefined) {
            throw new Error('Something wrong happened while saving the browser context path');
        }
        await saveBrowserContextPath(this.browserContext, browserContextFilePath)
    }

    /**
     * Load the browser context with the given parameters and returns a boolean indicating if it's correctly loaded
     * @param username Username of the user to load the context for
     * @param password The password of the user to load the context for
     * @returns True if the browser context sucessfully loaded, false if not
     */
    async #loadBrowserContextPath(username: string, password: string) {
        const id = getBrowserContextIdentifier(this.browser.browserType(), username, password);
        const path = getBrowserContextFilePath(id);
        if (path !== undefined && isBrowserContextExists(path)) {
            this.browserContext = await loadBrowserContextPath(this.browser, path);
            this.mobileBrowserContext = await loadBrowserContextPath(this.mobileBrowser, path);
            this.page = await this.browserContext.newPage();
            this.mobilePage = await this.mobileBrowserContext.newPage();
            return true;
        }
        return false;
    }

    /**
     * Initializes the item page for the given item id and navigate to the page url
     * @param id The if of the item to get the details from
     * @returns The item page initialized with the corresponding item id
     */
    async item(id: string): Promise<AliExpressItemPage> {
        const itemPage = new AliExpressItemPage(id, this.page, this.mobilePage);
        await itemPage.init();
        return itemPage;
    }
}
