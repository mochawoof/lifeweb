let assetLoader = {};
let cache = {};
let caching = null;

function cacheImagesRange(i, end, cb) {
    let im = new Image();
    im.onload = (e) => {
        cache[caching[i]] = im;
        if (i + 1 < end) {
            cacheImages(i + 1, end, cb);
        } else {
            caching = null;
            cb();
            return;
        }
    }
    im.src = caching[i];
}

assetLoader.loadImages = (images, cb) => {
    if (caching == null) {
        caching = images;
        cacheImagesRange(0, caching.length, cb);
        return;
    }
}

assetLoader.get = (image) => {
    return cache[image];
}