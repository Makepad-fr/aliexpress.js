# AliExpress.js

## Installation

## Usage

## Example

Here's an example application to save the item details in to a JSON file:

```ts
import AliExpress from "@makepad/aliexpressjs";

async function downloadPhotoFromURL(url: URL) {
    console.log(`The URL of the photo to download ${url}`);
    return '1234';
}

async function main() {
    const username = process.env['USERNAME'];
    const password = process.env['PASSWORD'];
    const itemId = process.env['ITEM_ID'];
    if (itemId !== undefined) {
        const aliExpress = new AliExpress();
        let userCredentials: { username: string, password: string } | undefined = undefined;
        if (username !== undefined && password !== undefined) {
            userCredentials = {username, password};
        }
        await aliExpress.init({
            launchOptions: {headless: false}, userCredentials
        });
        const item = await aliExpress.item(itemId);
        await item.save({
            downloadDescriptionPhotos: downloadPhotoFromURL,
            downloadThumbnailPhotos: downloadPhotoFromURL,
            downloadCommentPhotos: downloadPhotoFromURL
        });
        return;
    }
    console.error('Please provide an itemId');
}

main().then(() => {
    console.log('Done');
});

```
