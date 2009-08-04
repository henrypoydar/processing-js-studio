var rgb2Hex = function(r, g, b) {
  var res = "";
  var aClr = [r, g, b];
  var aHex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

  for(var i = 0; i < 3; i++) {
    var code1 = Math.floor(aClr[i] / 16);
    var code2 = aClr[i] - code1 * 16;
    res += aHex[code1];
    res += aHex[code2];
  }
  return '#' + res;
};


var hexPaletteFromCanvas = function(canvas) {
  var palette_data = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  var hex_palette = [];
  for (var i=0; i < palette_data.length; i=i+4) {
    hex_palette.push(rgb2Hex(palette_data[i], palette_data[i+1], palette_data[i+2]));
  }
  return hex_palette.unique().sort();
}