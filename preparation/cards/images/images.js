require('dotenv').config();
let imagekit = require('../../../src/libs/imagekit');


async function main() {
    let category = 'race';
    let files = await imagekit.listFiles({
        path: `chipmunk/${category}`
    });

    let urls = files.map(file => {
        return file.url;
    });

    // exports urls to json
    let fs = require('fs');
    fs.writeFileSync(`./preparation/cards/images/${category}_urls.json`, JSON.stringify(urls, null, 2));

}

main()

