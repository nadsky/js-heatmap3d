/*
 (c) 2014, Vladimir Agafonkin
 simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas
 https://github.com/mourner/simpleheat
*/
(function () { 'use strict';
function simpleheat(canvas) {
    // jshint newcap: false, validthis: true
    if (!(this instanceof simpleheat)) { return new simpleheat(canvas); }
    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;
    this._max = 1;
    this._data = [];
}
simpleheat.prototype = {      
    defaultRadius: 25,
    defaultGradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },
    data: function (data) {
        this._data = data;
        return this;
    },
    max: function (max) {
        this._max = max;
        return this;
    },
    add: function (point) {
        this._data.push(point);
        return this;
    },
    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 15 : blur;
        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = document.createElement('canvas'),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;
        circle.width = circle.height = r2 * 2;        
        var pp = 200;
        ctx.shadowOffsetX = ctx.shadowOffsetY = pp;
        ctx.shadowBlur =  blur;
        ctx.shadowColor = 'black';
        ctx.beginPath();
        ctx.arc(r2 - pp, r2 - pp, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        return this;
    },
    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, 0, 256);
        canvas.width = 1;
        canvas.height = 256;
        for (var i in grad) {
            gradient.addColorStop(i, grad[i]);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);
        this._grad = ctx.getImageData(0, 0, 1, 256).data;
        return this;
    },
    scaleContext: function (invRatio) {		
	    var tempCanvas = document.createElement('canvas');
	    var oriWidth = tempCanvas.width = this._canvas.width;
        var oriHeight = tempCanvas.height = this._canvas.height;       
		var tempCanvasCtx = tempCanvas.getContext('2d');
       // this.tempCanvasCtx.clearRect(0, 0, this._width, this._height);  
        tempCanvasCtx.drawImage(this._canvas, 0, 0); 
        tempCanvas.width = oriWidth * invRatio;
        tempCanvas.height = oriHeight * invRatio;
    	tempCanvasCtx.drawImage(this._canvas, 0, 0, oriWidth, oriHeight, 0, 0,  tempCanvas.width , tempCanvas.height);  
        return tempCanvas; 
    },
    draw: function (minOpacity) {
        if (!this._circle) {
            this.radius(this.defaultRadius);
        }
        if (!this._grad) {
            this.gradient(this.defaultGradient);
        }
        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);
        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }
        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);
 
        return this;
    },
    _colorize: function (pixels, gradient) {
        for (var i = 3, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i] *  4; // get gradient color from opacity value
            if (j) {                  
                pixels[i - 3] =  gradient[j];             
                pixels[i - 2] =  gradient[j + 1];          
                pixels[i - 1] =  gradient[j + 2];
            }
        }
    }
};
window.simpleheat = simpleheat;
})();
