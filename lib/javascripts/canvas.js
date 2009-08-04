var scaleCanvas = function(canvas, width, height) {
  var c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.style.width = width + 'px';
  c.style.height = height + 'px';
  var c_ctx = c.getContext("2d");
  c_ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
  return c;
};

var encodeCanvas = function(canvas) {
  return canvas.toDataURL("image/png").split(',')[1];
};
