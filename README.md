# AliExpress.js

---
**Important:** The repository is under active development. Use it in production at your own risk.

---

## 🎯 Motivation

[AliExpress] is world's one of the biggest product supplier. There are many e-commerce and physical stores relying
on [AliExpress] as their product supplier. Our main goal with AliExpress.js is to give the ability to automate boring
and repetitive stuff on your store management.\
If you want to have a tailored solution for your e-commerce store automation, please feel free to [contact us].

## 📦 Installation

```
npm install @makepad/aliexpressjs
```

## ⚡ Example

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

### 📅 Roadmap

Do you want to know what are next steps? Or are you looking for a specific feature or a bug fix ?
Please check [Roadmap] for current state of all bug fixes and feature implementations

### 👨‍💻 Contributing

All contributions are welcome. Please check [open issues] and [create a new issue] before diving into the code. \

### 🐛 Bugs

Found something not working correctly ? Checkout [reported bugs] to see if this is something already known. \
If not, please [report a bug] before starting to fixing it

[Roadmap]: https://github.com/orgs/Makepad-fr/projects/5/

[open issues]: https://github.com/Makepad-fr/aliexpress.js/issues?q=is%3Aissue+is%3Aopen

[create new issue]: https://github.com/Makepad-fr/aliexpress.js/issues/new?assignees=&labels=feature%2C+request&template=feature_request.md&title=%5BFEATURE+REQUEST%5D

[report a bug]: https://github.com/Makepad-fr/aliexpress.js/issues/new?assignees=&labels=bug&template=bug_report.md&title=%5BBUG%5D

[reported bugs]: https://github.com/Makepad-fr/aliexpress.js/issues?q=is%3Aissue+is%3Aopen+label%3Abug

[AliExpress]: https://aliexpress.com

[contact us]: mailto:dev@makepad.fr
