let cache = {};
let caching = null;

function cacheImages(i, end, cb) {
    let im = new Image(caching[i][1], caching[i][2]);
}

assetLoader.loadImages = (images, cb) => {
    if (caching == null) {
        caching = images;
        caching.forEach((e) => {
            cacheImages(0, caching.length, cb);
        });
    }
}