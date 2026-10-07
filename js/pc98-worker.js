// Runs the PC-98 filter off the main thread, so a page of covers never freezes scrolling: post a cover's pixels
// ({id, rgba, width, height, opts}), get the art back ({id, width, height, data}). Same steps as PC98.render.
importScripts("/js/pc98.js?version=1");

self.onmessage = function (e) {
    var d = e.data;
    try {
        var res = self.PC98.process(d.rgba, d.width, d.height, d.opts);
        var up = self.PC98.upscale(res, res.pixel);
        var data = new Uint8ClampedArray(up.data.buffer, up.data.byteOffset, up.data.length);
        self.postMessage({ id: d.id, width: up.width, height: up.height, data: data }, [data.buffer]);
    } catch (err) {
        self.postMessage({ id: d.id, error: String(err) });
    }
};
