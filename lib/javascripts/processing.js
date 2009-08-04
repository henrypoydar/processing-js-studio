/*
 * Processing.js - John Resig (http://ejohn.org/)
 * MIT Licensed
 * http://ejohn.org/blog/processingjs/
 *
 * This is a port of the Processing Visualization Language.
 * More information: http://processing.org/
 */

(function(){
this.Processing = function Processing( aElement, aCode) {

  if ( typeof aElement == "string" )
    aElement = document.getElementById( aElement );
    
  var p = buildProcessing( aElement );  

  if ( aCode )
    p.init( aCode );

  return p;
};

function log() {
  try {
    console.log.apply( console, arguments );
  } catch(e) {
    try {
      opera.postError.apply( opera, arguments );
    } catch(e){}
  }
}

var parse = Processing.parse = function parse( aCode, p ) {
  // Angels weep at this parsing code :-(

  // Remove end-of-line comments
  aCode = aCode.replace(/\/\/ .*\n/g, "\n");

  // Weird parsing errors with %
  aCode = aCode.replace(/([^\s])%([^\s])/g, "$1 % $2");
 
  // Simple convert a function-like thing to function
  aCode = aCode.replace(/(?:static )?(\w+ )(\w+)\s*(\([^\)]*\)\s*{)/g, function(all, type, name, args) {
    if ( name == "if" || name == "for" || name == "while" ) {
      return all;
    } else {
      return "Processing." + name + " = function " + name + args;
    }
  });
    
  // Attach import() to p{} bypassing JS command, allowing for extrernal library loading
  aCode = aCode.replace(/import \(|import\(/g, "p.Import(");
  
  // Force .length() to be .length
  aCode = aCode.replace(/\.length\(\)/g, ".length");

  // foo( int foo, float bar )
  aCode = aCode.replace(/([\(,]\s*)(\w+)((?:\[\])+| )\s*(\w+\s*[\),])/g, "$1$4");
  aCode = aCode.replace(/([\(,]\s*)(\w+)((?:\[\])+| )\s*(\w+\s*[\),])/g, "$1$4");

  // float[] foo = new float[5];
  aCode = aCode.replace(/new (\w+)((?:\[([^\]]*)\])+)/g, function(all, name, args) {
    return "new ArrayList(" + args.slice(1,-1).split("][").join(", ") + ")";
  });
  
  aCode = aCode.replace(/(?:static )?\w+\[\]\s*(\w+)\[?\]?\s*=\s*{.*?};/g, function(all) {
    return all.replace(/{/g, "[").replace(/}/g, "]");
  });

  // int|float foo;
  var intFloat = /(\n\s*(?:int|float)(?:\[\])?(?:\s*|[^\(]*?,\s*))([a-z]\w*)(;|,)/i;
  while ( intFloat.test(aCode) ) {
    aCode = aCode.replace(new RegExp(intFloat), function(all, type, name, sep) {
      return type + " " + name + " = 0" + sep;
    });
  }

  // float foo = 5;
  aCode = aCode.replace(/(?:static )?(\w+)((?:\[\])+| ) *(\w+)\[?\]?(\s*[=,;])/g, function(all, type, arr, name, sep) {
    if ( type == "return" )
      return all;
    else
      return "var " + name + sep;
  });

  // Fix Array[] foo = {...} to [...]
  aCode = aCode.replace(/=\s*{((.|\s)*?)};/g, function(all,data) {
    return "= [" + data.replace(/{/g, "[").replace(/}/g, "]") + "]";
  });
  
  // static { ... } blocks
  aCode = aCode.replace(/static\s*{((.|\n)*?)}/g, function(all, init) {
    // Convert the static definitons to variable assignments
    //return init.replace(/\((.*?)\)/g, " = $1");
    return init;
  });

  // super() is a reserved word
  aCode = aCode.replace(/super\(/g, "superMethod(");

  var classes = ["int", "float", "boolean", "string"];

  function ClassReplace(all, name, extend, vars, last) {
    classes.push( name );

    var static = "";

    vars = vars.replace(/final\s+var\s+(\w+\s*=\s*.*?;)/g, function(all,set) {
      static += " " + name + "." + set;
      return "";
    });

    // Move arguments up from constructor and wrap contents with
    // a with(this), and unwrap constructor
    return "function " + name + "() {with(this){\n  " +
      (extend ? "var __self=this;function superMethod(){extendClass(__self,arguments," + extend + ");}\n" : "") +
      // Replace var foo = 0; with this.foo = 0;
      // and force var foo; to become this.foo = null;
      vars
        .replace(/,\s?/g, ";\n  this.")
        .replace(/\b(var |final |public )+\s*/g, "this.")
        .replace(/\b(var |final |public )+\s*/g, "this.")
        .replace(/this.(\w+);/g, "this.$1 = null;") + 
        (extend ? "extendClass(this, " + extend + ");\n" : "") +
        "<CLASS " + name + " " + static + ">" + (typeof last == "string" ? last : name + "(");
  }

  var matchClasses = /(?:public |abstract |static )*class (\w+)\s*(?:extends\s*(\w+)\s*)?{\s*((?:.|\n)*?)\b\1\s*\(/g;
  var matchNoCon = /(?:public |abstract |static )*class (\w+)\s*(?:extends\s*(\w+)\s*)?{\s*((?:.|\n)*?)(Processing)/g;
  
  aCode = aCode.replace(matchClasses, ClassReplace);
  aCode = aCode.replace(matchNoCon, ClassReplace);

  var matchClass = /<CLASS (\w+) (.*?)>/, m;
  
  while ( (m = aCode.match( matchClass )) ) {
    var left = RegExp.leftContext,
      allRest = RegExp.rightContext,
      rest = nextBrace(allRest),
      className = m[1],
      staticVars = m[2] || "";
      
    allRest = allRest.slice( rest.length + 1 );

    rest = rest.replace(new RegExp("\\b" + className + "\\(([^\\)]*?)\\)\\s*{", "g"), function(all, args) {
      args = args.split(/,\s*?/);
      
      if ( args[0].match(/^\s*$/) )
        args.shift();
      
      var fn = "if ( arguments.length == " + args.length + " ) {\n";
        
      for ( var i = 0; i < args.length; i++ ) {
        fn += "    var " + args[i] + " = arguments[" + i + "];\n";
      }
        
      return fn;
    });
    
    // Fix class method names
    // this.collide = function() { ... }
    // and add closing } for with(this) ...
    rest = rest.replace(/(?:public )?Processing.\w+ = function (\w+)\((.*?)\)/g, function(all, name, args) {
      return "ADDMETHOD(this, '" + name + "', function(" + args + ")";
    });
    
    var matchMethod = /ADDMETHOD([\s\S]*?{)/, mc;
    var methods = "";
    
    while ( (mc = rest.match( matchMethod )) ) {
      var prev = RegExp.leftContext,
        allNext = RegExp.rightContext,
        next = nextBrace(allNext);

      methods += "addMethod" + mc[1] + next + "});"
      
      rest = prev + allNext.slice( next.length + 1 );
    }

    rest = methods + rest;
    
    aCode = left + rest + "\n}}" + staticVars + allRest;
  }

  // Do some tidying up, where necessary
  aCode = aCode.replace(/Processing.\w+ = function addMethod/g, "addMethod");
  
  function nextBrace( right ) {
    var rest = right;
    var position = 0;
    var leftCount = 1, rightCount = 0;
    
    while ( leftCount != rightCount ) {
      var nextLeft = rest.indexOf("{");
      var nextRight = rest.indexOf("}");
      
      if ( nextLeft < nextRight && nextLeft != -1 ) {
        leftCount++;
        rest = rest.slice( nextLeft + 1 );
        position += nextLeft + 1;
      } else {
        rightCount++;
        rest = rest.slice( nextRight + 1 );
        position += nextRight + 1;
      }
    }
    
    return right.slice(0, position - 1);
  }

  // Handle (int) Casting
  aCode = aCode.replace(/\(int\)/g, "0|");

  // Remove Casting
  aCode = aCode.replace(new RegExp("\\((" + classes.join("|") + ")(\\[\\])?\\)", "g"), "");
  
  // Convert 3.0f to just 3.0
  aCode = aCode.replace(/(\d+)f[^a-zA-Z0-9]/g, "$1");

  // Force numbers to exist
  //aCode = aCode.replace(/([^.])(\w+)\s*\+=/g, "$1$2 = ($2||0) +");

  // Force characters-as-bytes to work
  aCode = aCode.replace(/('[a-zA-Z0-9]')/g, "$1.charCodeAt(0)");

  // Convert #aaaaaa into color
  aCode = aCode.replace(/#([a-f0-9]{6})/ig, function(m, hex){
    var num = toNumbers(hex);
    return "DefaultColor(" + num[0] + "," + num[1] + "," + num[2] + ")";
  });

  function toNumbers( str ){
    var ret = [];
     str.replace(/(..)/g, function(str){
      ret.push( parseInt( str, 16 ) );
    });
    return ret;
  }

//log(aCode);

  return aCode;
};

function buildProcessing( curElement ){        
            
  var p = {};
  
  // Eval imported libraries  
  //for( var i = 0; var len = libs
  
  // init
  p.PI = Math.PI;
  p.TWO_PI = 2 * p.PI;
  p.HALF_PI = p.PI / 2;
  p.P3D = 3;
  p.CORNER = 0;
  p.RADIUS = 1;
  p.CENTER_RADIUS = 1;
  p.CENTER = 2;
  p.POLYGON = 2;
  p.QUADS = 5;
  p.TRIANGLES = 6;
  p.POINTS = 7;
  p.LINES = 8;
  p.TRIANGLE_STRIP = 9;
  p.TRIANGLE_FAN = 4;
  p.QUAD_STRIP = 3;
  p.CORNERS = 10;
  p.CLOSE = true;
  p.RGB = 1;
  p.HSB = 2;  

  // mouseButton constants: values adjusted to come directly from e.which
  // CONFLICT: LEFT and RIGHT are keyboard values in Processing already. - F1lT3R         
  // RESOLUTION: Extended Keyboard & Mouse variables  
  p.CENTER = 88888880;
  p.CODED  = 88888888;
  p.UP      = 88888870;
  p.RIGHT   = 88888871;
  p.DOWN    = 88888872;
  p.LEFT    = 88888869;
  p.codedKeys = [69, 70, 71, 72];

  // "Private" variables used to maintain state
  var curContext = curElement.getContext("2d");
  var doFill = true;
  var doStroke = true;
  var loopStarted = false;
  var hasBackground = false;
  var doLoop = true;
  var looping = 0;
  var curRectMode = p.CORNER;
  var curEllipseMode = p.CENTER;
  var inSetup = false;
  var inDraw = false;
  var curBackground = "rgba(204,204,204,1)";
  var curFrameRate = 1000;
  var curShape = p.POLYGON;
  var curShapeCount = 0;
  var curvePoints = [];
  var curTightness = 0;
  var opacityRange = 255;
  var redRange = 255;
  var greenRange = 255;
  var blueRange = 255;
  var pathOpen = false;
  var mousePressed = false;
  var keyPressed = false;
  var firstX, firstY, secondX, secondY, prevX, prevY;
  var curColorMode = p.RGB;
  var curTint = -1;
  var curTextSize = 12;
  var curTextFont = "Arial";
  var getLoaded = false;
  var start = (new Date).getTime();
  
  // println(), print()
  p.ln = "";
  
  // Glyph path storage for quick rendering  
  p.glyphTable = {};
  
  // Global vars for tracking mouse position
  p.pmouseX = 0;
  p.pmouseY = 0;
  p.mouseX = 0;
  p.mouseY = 0;
  p.mouseButton = 0;
  p.mouseDown = false;

  // Will be replaced by the user, most likely
  p.mouseClicked = undefined;
  p.mouseDragged = undefined;
  p.mouseMoved = undefined;
  p.mousePressed = undefined;
  p.mouseReleased = undefined;
  p.keyPressed = undefined;
  p.keyReleased = undefined;
  p.draw = undefined;
  p.setup = undefined;

  // The height/width of the canvas
  p.width = curElement.width - 0;
  p.height = curElement.height - 0;

  // The current animation frame
  p.frameCount = 0;
  
  // Forced default color mode for #aaaaaa style
  p.DefaultColor = function ( aValue1, aValue2, aValue3) {
    var tmpColorMode = curColorMode;
    curColorMode = p.RGB;
    var c = p.color( ((aValue1 / 255) * redRange), ((aValue2 / 255) * greenRange), ((aValue3 / 255) * blueRange));
    curColorMode = tmpColorMode;
    return c;
  }      
    
  p.ajax=function(url){
    if(window.XMLHttpRequest){AJAX=new XMLHttpRequest();}
    else{AJAX=new ActiveXObject("Microsoft.XMLHTTP");}
    if(AJAX){
       AJAX.open("GET",url,false);
       AJAX.send(null);
       return AJAX.responseText;
    }else{return false;}
  }
  
  p.Import=function Import(lib){
    eval(p.ajax(lib));
  }
  
  // Load a file or URL into strings     
  p.loadStrings = function loadStrings(url) {
    return p.ajax(url).split("\n");              
  };
  
  // In case I ever need to do HSV conversion:
  // http://srufaculty.sru.edu/david.dailey/javascript/js/5rml.js
  p.color = function color( aValue1, aValue2, aValue3, aValue4 ) {
    var aColor = "";
    
    if ( arguments.length == 3 ) {
      aColor = p.color( aValue1, aValue2, aValue3, opacityRange );
    } else if ( arguments.length == 4 ) {
      var a = aValue4 / opacityRange;
      a = isNaN(a) ? 1 : a;

      if ( curColorMode == p.HSB ) {
        var rgb = HSBtoRGB(aValue1, aValue2, aValue3);
        var r = rgb[0], g = rgb[1], b = rgb[2];
      } else {
        var r = getColor(aValue1, redRange);
        var g = getColor(aValue2, greenRange);
        var b = getColor(aValue3, blueRange);
      }

      aColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    } else if ( typeof aValue1 == "string" ) {
      aColor = aValue1;

      if ( arguments.length == 2 ) {
        var c = aColor.split(",");
        c[3] = (aValue2 / opacityRange) + ")";
        aColor = c.join(",");
      }
    } else if ( arguments.length == 2 ) {
      aColor = p.color( aValue1, aValue1, aValue1, aValue2 );
    } else if ( typeof aValue1 == "number" ) {
      aColor = p.color( aValue1, aValue1, aValue1, opacityRange );
    } else {
      aColor = p.color( redRange, greenRange, blueRange, opacityRange );
    }

    // HSB conversion function from Mootools, MIT Licensed
    function HSBtoRGB(h, s, b) {
      h = (h / redRange) * 360;
      s = (s / greenRange) * 100;
      b = (b / blueRange) * 100;
      var br = Math.round(b / 100 * 255);
      if (s == 0){
        return [br, br, br];
      } else {
        var hue = h % 360;
        var f = hue % 60;
        var p = Math.round((b * (100 - s)) / 10000 * 255);
        var q = Math.round((b * (6000 - s * f)) / 600000 * 255);
        var t = Math.round((b * (6000 - s * (60 - f))) / 600000 * 255);
        switch (Math.floor(hue / 60)){
          case 0: return [br, t, p];
          case 1: return [q, br, p];
          case 2: return [p, br, t];
          case 3: return [p, q, br];
          case 4: return [t, p, br];
          case 5: return [br, p, q];
        }
      }
    }

    function getColor( aValue, range ) {
      return Math.round(255 * (aValue / range));
    }
    
    return aColor;
  }
  
  p.red = function( aColor ) {        
    return parseInt( verifyChannel(aColor).slice(5) );
  };

  p.green = function( aColor ) {     
    return parseInt( verifyChannel(aColor).split(",")[1] );
  };

  p.blue = function( aColor ) {
    return parseInt( verifyChannel(aColor).split(",")[2] );
  };

  p.alpha = function( aColor ) {    
    return parseInt( parseFloat(verifyChannel(aColor).split(",")[3])*255 );
  };

  function verifyChannel(aColor){
    if(aColor.constructor == Array){    
      return aColor;
    } else {
      return p.color(aColor);
    }
  }

  
  // Added lerpColor() - F1LT3R - 08.11.14
  p.lerpColor = function lerpColor( c1, c2, amt ){
      
      // Get RGBA values for Color 1 to floats
      var colors1 = p.color(c1).split(",");
      var r1 = parseInt( colors1[0].split("(")[1] ); 
      var g1 = parseInt( colors1[1] );
      var b1 = parseInt( colors1[2] );
      var a1 = parseFloat( colors1[3].split(")")[0] );
          
      // Get RGBA values for Color 2 to floats
      var colors2 = p.color(c2).split(",");
      var r2 = parseInt( colors2[0].split("(")[1] ); 
      var g2 = parseInt( colors2[1] );
      var b2 = parseInt( colors2[2] );
      var a2 = parseFloat( colors2[3].split(")")[0] );            
                        
      // Return lerp value for each channel, INT for color, Float for Alpha-range
      var r = parseInt( p.lerp(r1, r2, amt) );
      var g = parseInt( p.lerp(g1, g2, amt) );
      var b = parseInt( p.lerp(b1, b2, amt) );
      var a = parseFloat( p.lerp(a1, a2, amt) );
      
      aColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
      return aColor;
  }
  
  p.nf = function( num, pad ) {
    var str = "" + num;
    while ( pad - str.length )
      str = "0" + str;
    return str;
  };

  p.AniSprite = function( prefix, frames ) {    
    this.images = [];
    this.pos = 0;

    for ( var i = 0; i < frames; i++ ) {
      this.images.push( prefix + p.nf( i, ("" + frames).length ) + ".gif" );
    }

    this.display = function( x, y ) {
      p.image( this.images[ this.pos ], x, y );

      if ( ++this.pos >= frames )
        this.pos = 0;
    };

    this.getWidth = function() {
      return getImage(this.images[0]).width;
    };

    this.getHeight = function() {
      return getImage(this.images[0]).height;
    };
  };

  function buildImageObject( obj ) {
    var pixels = obj.data;
    var data = p.createImage( obj.width, obj.height );

    if ( data.__defineGetter__ && data.__lookupGetter__ && !data.__lookupGetter__("pixels") ) {
      var pixelsDone;
      data.__defineGetter__("pixels", function() {
        if ( pixelsDone )
          return pixelsDone;

        pixelsDone = [];

        for ( var i = 0; i < pixels.length; i += 4 ) {
          pixelsDone.push( p.color(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]) );
        }

        return pixelsDone;
      });
    } else {
      data.pixels = [];

      for ( var i = 0; i < pixels.length; i += 4 ) {
        data.pixels.push( p.color(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]) );
      }
    }

    return data;
  }

  p.createImage = function createImage( w, h, mode ) {
    var data = {};
    data.width = w;
    data.height = h;
    data.data = [];

    if ( curContext.createImageData ) {
      data = curContext.createImageData( w, h );
    }

    data.pixels = new Array( w * h );
    data.get = function(x,y) {
      return this.pixels[w*y+x];
    };
    data._mask = null;
    data.mask = function(img) {
      this._mask = img;
    };
    data.loadPixels = function(){};
    data.updatePixels = function(){};

    return data;
  };

  p.createGraphics = function createGraphics( w, h ) {
    var canvas = document.createElement("canvas");
    var ret = buildProcessing( canvas );
    ret.size( w, h );
    ret.canvas = canvas;
    return ret;
  };

  p.beginDraw = function beginDraw(){};

  p.endDraw = function endDraw(){};

  p.tint = function tint( rgb, a ) {
    curTint = a;
  };

  function getImage( img ) {
    if ( typeof img == "string" ) {
      return document.getElementById(img);
    }

    if ( img.img || img.canvas ) {
      return img.img || img.canvas;
    }

    for ( var i = 0, l = img.pixels.length; i < l; i++ ) {
      var pos = i * 4;
      var c = (img.pixels[i] || "rgba(0,0,0,1)").slice(5,-1).split(",");
      img.data[pos] = parseInt(c[0]);
      img.data[pos+1] = parseInt(c[1]);
      img.data[pos+2] = parseInt(c[2]);
      img.data[pos+3] = parseFloat(c[3]) * 100;
    }

    var canvas = document.createElement("canvas")
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");
    context.putImageData( img, 0, 0 );

    img.canvas = canvas;

    return canvas;
  }

  p.image = function image( img, x, y, w, h ) {
    x = x || 0;
    y = y || 0;

    var obj = getImage(img);

    if ( curTint >= 0 ) {
      var oldAlpha = curContext.globalAlpha;
      curContext.globalAlpha = curTint / opacityRange;
    }

    if ( arguments.length == 3 ) {
      curContext.drawImage( obj, x, y );
    } else {
      curContext.drawImage( obj, x, y, w, h );
    }

    if ( curTint >= 0 ) {
      curContext.globalAlpha = oldAlpha;
    }

    if ( img._mask ) {
      var oldComposite = curContext.globalCompositeOperation;
      curContext.globalCompositeOperation = "darker";
      p.image( img._mask, x, y );
      curContext.globalCompositeOperation = oldComposite;
    }
  };

  p.exit = function exit() {
    clearInterval(looping);
  };

  p.save = function save( file ){};

  p.loadImage = function loadImage( file ) {
    var img = document.getElementById(file);
    if ( !img )
      return;

    var h = img.height, w = img.width;

    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext("2d");

    context.drawImage( img, 0, 0 );
    var data = buildImageObject( context.getImageData( 0, 0, w, h ) );
    data.img = img;
    return data;
  };

  p.loadFont = function loadFont( name ) {
    if(name.indexOf(".svg")==-1){
      return {
        name: name,
        width: function( str ) {
          if ( curContext.mozMeasureText )
            return curContext.mozMeasureText( typeof str == "number" ?
              String.fromCharCode( str ) :
              str) / curTextSize;
          else
            return 0;
        }
      };
    }else{// If the font is a glyph, calculate by SVG table 
      var font=p.loadGlyphs(name);
      return {
      name: name,
      glyph: true,
      units_per_em: font.units_per_em,
      horiz_adv_x: 1/font.units_per_em*font.horiz_adv_x,
      ascent: font.ascent,
      descent: font.descent,
      width: function( str ) {
        var width=0;
        var len = str.length;
        for(var i=0;i < len;i++){                          
          try{width+=parseFloat(p.glyphLook(p.glyphTable[name],str[i]).horiz_adv_x);}
          catch(e){;}
        }
        return width/p.glyphTable[name].units_per_em;
        }
      }
    }
  };

  p.textFont = function textFont( name, size ) {
    curTextFont = name;
    p.textSize( size );
  };

  p.textSize = function textSize( size ) {
    if ( size ) {
      curTextSize = size;
    }
  };

  p.textAlign = function textAlign(){};

  p.glyphLook = function glyphLook(font,chr){
    try{
      switch(chr){
        case "1":return font["one"];break;
        case "2":return font["two"];break;
        case "3":return font["three"];break;
        case "4":return font["four"];break;
        case "5":return font["five"];break;
        case "6":return font["six"];break;
        case "7":return font["seven"];break;
        case "8":return font["eight"];break;
        case "9":return font["nine"];break;
        case "0":return font["zero"];break;
        case " ":return font["space"];break;
        case "$":return font["dollar"];break;
        case "!":return font["exclam"];break;
        case '"':return font["quotedbl"];break;
        case "#":return font["numbersign"];break;
        case "%":return font["percent"];break;
        case "&":return font["ampersand"];break;
        case "'":return font["quotesingle"];break;
        case "(":return font["parenleft"];break;
        case ")":return font["parenright"];break;
        case "*":return font["asterisk"];break;
        case "+":return font["plus"];break;
        case ",":return font["comma"];break;
        case "-":return font["hyphen"];break;
        case ".":return font["period"];break;
        case "/":return font["slash"];break;
        case "_":return font["underscore"];break;
        case ":":return font["colon"];break;
        case ";":return font["semicolon"];break;
        case "<":return font["less"];break;
        case "=":return font["equal"];break;
        case ">":return font["greater"];break;
        case "?":return font["question"];break;
        case "@":return font["at"];break;
        case "[":return font["bracketleft"];break;
        case "\\":return font["backslash"];break;
        case "]":return font["bracketright"];break;
        case "^":return font["asciicircum"];break;
        case "`":return font["grave"];break;
        case "{":return font["braceleft"];break;
        case "|":return font["bar"];break;
        case "}":return font["braceright"];break;
        case "~":return font["asciitilde"];break;
        default:return font[chr]; break;
      }
    }catch(e){;}
  }
  
  p.text = function text( str, x, y ) {
    if(!curTextFont.glyph){
      if ( str && curContext.mozDrawText ) {
        curContext.save();
        curContext.mozTextStyle = curTextSize + "px " + curTextFont.name;
        curContext.translate(x, y);
        curContext.mozDrawText( typeof str == "number" ?
          String.fromCharCode( str ) :
          str );
        curContext.restore();
      }
    }else{
      var font=p.glyphTable[curTextFont.name];
        curContext.save();
        curContext.translate(x,y+curTextSize);
        var upem = font["units_per_em"];
        var newScale=1/upem*curTextSize;
        curContext.scale(newScale,newScale);
        var len = str.length;
        for(var i=0;i < len;i++){
          try{p.glyphLook(font,str[i]).draw();}
          catch(e){;}
        }
      curContext.restore();
    }
  };
  
  
  // Load Batik SVG Fonts and parse to pre-def objects for quick rendering - F1LT3R 
  p.loadGlyphs=function loadGlyph(url){
      // SJAX SVG as XML D.O.
      var loadXML=function loadXML(){
        try{var xmlDoc=new ActiveXObject("Microsoft.XMLDOM");}
        catch(e){try{xmlDoc=document.implementation.createDocument("","",null);}
        catch(e){p.println(e.message);return;}}
          try{// Firefox, Mozilla, Opera, etc.
            xmlDoc.async=false;
            xmlDoc.load(url);
            parse(xmlDoc.getElementsByTagName("svg")[0]);
            }
          catch(e){try{// Google Chrome, Safari etc.
             try{console.log(e)}catch(e){alert(e);}
             var xmlhttp = new window.XMLHttpRequest();
             xmlhttp.open("GET",url,false);
             xmlhttp.send(null);
             parse(xmlhttp.responseXML.documentElement);
            }catch(e){}
          }
      }
      
      // Return arrays of SVG commands and coords
      var regex=function regex(needle,hay){
        var regexp=new RegExp(needle,"g");
        var i=0;
        var results=[];
        while(results[i]=regexp.exec(hay)){i++;}
        return results;
      }        
      
      // Parse SVG font-file
      var parse=function parse(svg){
        
        // Store font attributes
        var font=svg.getElementsByTagName("font");
        p.glyphTable[url]["horiz_adv_x"]=font[0].getAttribute("horiz-adv-x");      
        var font_face=svg.getElementsByTagName("font-face")[0];                  
        p.glyphTable[url]["units_per_em"]=parseFloat(font_face.getAttribute("units-per-em"));
        p.glyphTable[url]["ascent"]=parseFloat(font_face.getAttribute("ascent"));
        p.glyphTable[url]["descent"]=parseFloat(font_face.getAttribute("descent"));          
        
        var getXY = "[0-9\-]+";
        var glyph = svg.getElementsByTagName("glyph");
        
        // Loop through each glyph in the SVG
        var len = glyph.length;
        for(var i=0;i < len;i++){
          
          // Store attributes for this glyph
          var unicode = glyph[i].getAttribute("unicode");
          var name = glyph[i].getAttribute("glyph-name");
          var horiz_adv_x = glyph[i].getAttribute("horiz-adv-x");
          if(horiz_adv_x==null){var horiz_adv_x=p.glyphTable[url]['horiz_adv_x'];}
          
          var buildPath = function buildPath(d){ 
            var c = regex("[A-Za-z][0-9\- ]+|Z",d);                                                    
            // Begin storing path object 
            var path="var path={draw:function(){curContext.beginPath();";//curContext.beginPath();
            // Loop through SVG commands translating to canvas eqivs functions in path object
            var x=0,y=0,cx=0,cy=0,nx=0,ny=0,d=0,a=0,lastCom="";
            var lenC = c.length-1;
            for(var j=0;j < lenC;j++){
              var com=c[j][0];
              var xy=regex(getXY,com);
              switch(com[0]){            
                case "M"://curContext.moveTo(x,-y);
                  x=parseFloat( xy[0][0] );
                  y=parseFloat( xy[1][0] );              
                  path+="curContext.moveTo("+(x)+","+(-y)+");";
                  break;
                case "L"://curContext.lineTo(x,-y);
                  x=parseFloat( xy[0][0] );
                  y=parseFloat( xy[1][0] );
                  path+="curContext.lineTo("+(x)+","+(-y)+");";
                  break;
                case "H"://curContext.lineTo(x,-y)
                  x=parseFloat( xy[0][0] );
                  path+="curContext.lineTo("+(x)+","+(-y)+");";
                  break;
                case "V"://curContext.lineTo(x,-y);
                  y=parseFloat( xy[0][0] );              
                  path+="curContext.lineTo("+(x)+","+(-y)+");";
                  break;
                case "T"://curContext.quadraticCurveTo(cx,-cy,nx,-ny);
                  nx=parseFloat( xy[0][0] );
                  ny=parseFloat( xy[1][0] );
                  if(lastCom=="Q"||lastCom=="T"){
                    d=Math.sqrt(Math.pow(x-cx,2)+Math.pow(cy-y,2));
                    a=Math.PI+Math.atan2(cx-x,cy-y);
                    cx=x+(Math.sin(a)*(d));
                    cy=y+(Math.cos(a)*(d));
                  }else{cx=x;cy=y;}       
                  path+="curContext.quadraticCurveTo("+(cx)+","+(-cy)+","+(nx)+","+(-ny)+");";
                  x=nx;y=ny;
                  break; 
                case "Q"://curContext.quadraticCurveTo(cx,-cy,nx,-ny);
                  cx=parseFloat( xy[0][0] );
                  cy=parseFloat( xy[1][0] );
                  nx=parseFloat( xy[2][0] );
                  ny=parseFloat( xy[3][0] );  
                  path+="curContext.quadraticCurveTo("+(cx)+","+(-cy)+","+(nx)+","+(-ny)+");";              
                  x=nx;y=ny;
                  break;
                case "Z"://curContext.closePath();
                  path+="curContext.closePath();";
                  break;
              }
              lastCom=com[0];
            }
            path+="curContext.translate("+(horiz_adv_x)+",0);";
            path+="doStroke?curContext.stroke():0;";
            path+="doFill?curContext.fill():0;";
            path+="}}";
            return path;
          }
          
          // Split path commands in glpyh          
          var d=glyph[i].getAttribute("d");
          if(d!==undefined){
            var path=buildPath(d);
            eval(path);
            // Store glyph data to table object
            p.glyphTable[url][name]={
              name:name,
              unicode:unicode,
              horiz_adv_x:horiz_adv_x,
              draw:path.draw
            }
          }                  
        } // finished adding glyphs to table
      }
      
      // Create a new object in glyphTable to store this font
      p.glyphTable[url]={};
      
      // Begin loading the Batik SVG font... 
      loadXML(url);
      
      // Return the loaded font for attribute grabbing
      return p.glyphTable[url];
  }
  
  
  // Returns a line to lnPrinted() for user handling 
  p.lnPrinted = function lnPrinted(){};
  p.printed = function printed(){};  
  p.println = function println(){
    var Caller = arguments.callee.caller.name.toString();
    if ( arguments.length > 1 ) {
      Caller!="print"?
        p.ln = arguments:
        p.ln = arguments[0];
    } else {
      p.ln = arguments[0];
    }
    Caller=="print"?        
      p.printed(arguments):
      p.lnPrinted();
  };
  p.print = function print(){ p.println(arguments[0])};
  
  p.char = function char( key ) {
    return key;
  };

  p.map = function map( value, istart, istop, ostart, ostop ) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
  };

  String.prototype.replaceAll = function(re, replace) {
    return this.replace(new RegExp(re, "g"), replace);
  };

  p.Point = function Point( x, y ) {
    this.x = x;
    this.y = y;
    this.copy = function() {
      return new Point( x, y );
    }
  };

  p.Random = function() {
    var haveNextNextGaussian = false;
    var nextNextGaussian;

    this.nextGaussian = function() {
      if (haveNextNextGaussian) {
        haveNextNextGaussian = false;

        return nextNextGaussian;
      } else {
        var v1, v2, s;
        do { 
          v1 = 2 * p.random(1) - 1;   // between -1.0 and 1.0
          v2 = 2 * p.random(1) - 1;   // between -1.0 and 1.0
          s = v1 * v1 + v2 * v2;
        } while (s >= 1 || s == 0);
        var multiplier = Math.sqrt(-2 * Math.log(s)/s);
        nextNextGaussian = v2 * multiplier;
        haveNextNextGaussian = true;

        return v1 * multiplier;
      }
    };
  };

  p.ArrayList = function ArrayList( size, size2, size3 ) {
    var array = new Array( 0 | size );
    
    if ( size2 ) {
      for ( var i = 0; i < size; i++ ) {
        array[i] = [];

        for ( var j = 0; j < size2; j++ ) {
          var a = array[i][j] = size3 ? new Array( size3 ) : 0;
          for ( var k = 0; k < size3; k++ ) {
            a[k] = 0;
          }
        }
      }
    } else {
      for ( var i = 0; i < size; i++ ) {
        array[i] = 0;
      }
    }
    
    array.size = function() {
      return this.length;
    };
    array.get = function( i ) {
      return this[ i ];
    };
    array.remove = function( i ) {
      return this.splice( i, 1 );
    };
    array.add = function( item ) {
      return this.push( item );
    };
    array.clone = function() {
      var a = new ArrayList( size );
      for ( var i = 0; i < size; i++ ) {
        a[ i ] = this[ i ];
      }
      return a;
    };
    array.isEmpty = function() {
      return !this.length;
    };
    array.clear = function() {
      this.length = 0;
    };
    
    return array;
  };
  
  p.colorMode = function colorMode( mode, range1, range2, range3, range4 ) {
    curColorMode = mode;

    if ( arguments.length >= 4 ) {
      redRange = range1;
      greenRange = range2;
      blueRange = range3;
    }

    if ( arguments.length == 5 ) {
      opacityRange = range4;
    }

    if ( arguments.length == 2 ) {
      p.colorMode( mode, range1, range1, range1, range1 );
    }
  };
  
  p.beginShape = function beginShape( type ) {
    curShape = type;
    curShapeCount = 0; 
    curvePoints = [];
  };
  
  p.endShape = function endShape( close ) {
    if ( curShapeCount != 0 ) {
      if ( close || doFill ) 
      curContext.lineTo( firstX, firstY );

      if ( doFill )
        curContext.fill();
        
      if ( doStroke )
        curContext.stroke();
    
      curContext.closePath();
      curShapeCount = 0;
      pathOpen = false;
    }

    if ( pathOpen ) {
      if ( doFill )
        curContext.fill();

      if ( doStroke )
        curContext.stroke();

      curContext.closePath();
      curShapeCount = 0;
      pathOpen = false;
    }
  };
  
  p.vertex = function vertex( x, y, x2, y2, x3, y3 ) {    
    if ( curShapeCount == 0 && curShape != p.POINTS ) {
      pathOpen = true;
      curContext.beginPath();
      curContext.moveTo( x, y );
      firstX = x;
      firstY = y;
    } else {
      if ( curShape == p.POINTS ) {
        p.point( x, y );
      } else if ( arguments.length == 2 ) {
        if ( curShape != p.QUAD_STRIP || curShapeCount != 2 )
          curContext.lineTo( x, y );
        if ( curShape == p.TRIANGLE_STRIP ) {
          if ( curShapeCount == 2 ) {
            // finish shape
            p.endShape(p.CLOSE);
            pathOpen = true;
            curContext.beginPath();
            
            // redraw last line to start next shape
            curContext.moveTo( prevX, prevY );
            curContext.lineTo( x, y );
            curShapeCount = 1;
          }
          firstX = prevX;
          firstY = prevY;
        }

        if ( curShape == p.TRIANGLE_FAN && curShapeCount == 2 ) {
          // finish shape
          p.endShape(p.CLOSE);
          pathOpen = true;
          curContext.beginPath();
      
          // redraw last line to start next shape
          curContext.moveTo( firstX, firstY );
          curContext.lineTo( x, y );
          curShapeCount = 1;
        }
    
        if ( curShape == p.QUAD_STRIP && curShapeCount == 3 ) {
          // finish shape
          curContext.lineTo( prevX, prevY );
          p.endShape(p.CLOSE);
          pathOpen = true;
          curContext.beginPath();
    
          // redraw lines to start next shape
          curContext.moveTo( prevX, prevY );
          curContext.lineTo( x, y );
          curShapeCount = 1;
        }

        if ( curShape == p.QUAD_STRIP) {
          
          firstX = secondX;
          firstY = secondY;
          secondX = prevX;
          secondY = prevY;
        }
      } else if ( arguments.length == 4 ) {
        if ( curShapeCount > 1 ) {
          curContext.moveTo( prevX, prevY );
          curContext.quadraticCurveTo( firstX, firstY, x, y );
          curShapeCount = 1;
        }
      } else if ( arguments.length == 6 ) {
        curContext.bezierCurveTo( x, y, x2, y2, x3, y3 );
        //curShapeCount = -1; // Removed due to Heart-Shape issue. - F1LT3R
      }
    }

    prevX = x;
    prevY = y;
    curShapeCount++;
    
    if ( curShape == p.LINES && curShapeCount == 2 ||
         (curShape == p.TRIANGLES) && curShapeCount == 3 ||
     (curShape == p.QUADS) && curShapeCount == 4 ) {
      p.endShape(p.CLOSE);
    }
  };

  p.curveVertex = function( x, y, x2, y2 ) {
    if ( curvePoints.length < 3 ) {
      curvePoints.push([x,y]);
    } else {
      var b = [], s = 1 - curTightness;

      /*
       * Matrix to convert from Catmull-Rom to cubic Bezier
       * where t = curTightness
       * |0         1          0         0       |
       * |(t-1)/6   1          (1-t)/6   0       |
       * |0         (1-t)/6    1         (t-1)/6 |
       * |0         0          0         0       |
       */

      curvePoints.push([x,y]);

      b[0] = [curvePoints[1][0],curvePoints[1][1]];
      b[1] = [curvePoints[1][0]+(s*curvePoints[2][0]-s*curvePoints[0][0])/6,curvePoints[1][1]+(s*curvePoints[2][1]-s*curvePoints[0][1])/6];
      b[2] = [curvePoints[2][0]+(s*curvePoints[1][0]-s*curvePoints[3][0])/6,curvePoints[2][1]+(s*curvePoints[1][1]-s*curvePoints[3][1])/6];
      b[3] = [curvePoints[2][0],curvePoints[2][1]];

      if ( !pathOpen ) {
        p.vertex( b[0][0], b[0][1] );
      } else {
        curShapeCount = 1;
      }

      p.vertex( b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1] );
      curvePoints.shift();
    }
  };

  p.curveTightness = function( tightness ) {
    curTightness = tightness;
  };

  p.bezierVertex = p.vertex;
  
  p.rectMode = function rectMode( aRectMode ) {
    curRectMode = aRectMode;
  };

  p.imageMode = function(){};
  
  p.ellipseMode = function ellipseMode( aEllipseMode ) {
    curEllipseMode = aEllipseMode;
  };
  
  p.dist = function dist( x1, y1, x2, y2 ) {
    return Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) );
  };

  p.year = function year() {
    return (new Date).getYear() + 1900;
  };

  p.month = function month() {
    return (new Date).getMonth();
  };

  p.day = function day() {
    return (new Date).getDay();
  };

  p.hour = function hour() {
    return (new Date).getHours();
  };

  p.minute = function minute() {
    return (new Date).getMinutes();
  };

  p.second = function second() {
    return (new Date).getSeconds();
  };

  p.millis = function millis() {
    return (new Date).getTime() - start;
  };
  
  p.ortho = function ortho(){};
  
  p.translate = function translate( x, y ) {
    curContext.translate( x, y );
  };
  
  p.scale = function scale( x, y ) {
    curContext.scale( x, y || x );
  };
  
  p.rotate = function rotate( aAngle ) {
    curContext.rotate( aAngle );
  };
  
  p.pushMatrix = function pushMatrix() {
    curContext.save();
  };
  
  p.popMatrix = function popMatrix() {
    curContext.restore();
  };
  
  p.redraw = function redraw() {
    
    if ( hasBackground ) {
      p.background();
    }

    p.frameCount++;
    
    inDraw = true;
    p.pushMatrix();
    p.draw();
    p.popMatrix();
    inDraw = false;
  };
  
  p.loop = function loop() {
    if (loopStarted)
      return;
    
    looping = setInterval(function() {
      try {
        p.redraw();  
      }
      catch(e) {
        clearInterval( looping );
        throw e;
      }
    }, 1000 / curFrameRate );
    
    loopStarted = true;
  };
  
  p.frameRate = function frameRate( aRate ) {
    curFrameRate = aRate;
  };
  
  p.background = function background( img ) {
    if ( arguments.length ) {
      if ( img && img.img ) {
        curBackground = img;
      } else {
        curBackground = p.color.apply( this, arguments );
      }
    }    

    if ( curBackground.img ) {
      p.image( curBackground, 0, 0 );
    } else {
      var oldFill = curContext.fillStyle;
      curContext.fillStyle = curBackground + "";
      curContext.fillRect( 0, 0, p.width, p.height );
      curContext.fillStyle = oldFill;
    }
  };
  
  // Clear function - F1LT3R - Not native to Processing
  p.clear = function clear ( x, y, width, height ) {    
    arguments.length==0?
      curContext.clearRect(0,0,p.width,p.height):
      curContext.clearRect(x,y,width,height);     
  }
  
  // Str() - F1LT3R
  p.str = function str( aNumber ){
      return aNumber+'';
  }
  
  p.sq = function sq( aNumber ) {
    return aNumber * aNumber;
  };

  p.sqrt = function sqrt( aNumber ) {
    return Math.sqrt( aNumber );
  };

  // ngsqrt() - Personal Function - F1LT3R // Allows me to calculate the positive square root of a negative number
  p.ngsqrt = function ngsqrt( aNumber ) {
    if (aNumber <= 0){
      return Math.sqrt( -aNumber );
    } else {
      return Math.sqrt( aNumber );
    }
  };
  
  p.int = function int( aNumber ) {
    return Math.floor( aNumber );    
  };

  p.min = function min( aNumber, aNumber2 ) {
    return Math.min( aNumber, aNumber2 );
  };

  p.max = function max( aNumber, aNumber2 ) {
    return Math.max( aNumber, aNumber2 );
  };

  p.ceil = function ceil( aNumber ) {
    return Math.ceil( aNumber );
  };
  
  p.round = function round( aNumber ) {
    return Math.round( aNumber );
  };

  p.norm = function norm( aNumber, low, high ) {
    var range = high-low;
    return ( ( 1 / range ) * aNumber ) - ( ( 1 / range ) * low );
  };

  p.lerp = function lerp( value1, value2, amt ) {
    var range = value2 - value1;
    return ( range * amt ) + value1;
  }
  
  p.floor = function floor( aNumber ) {
    return Math.floor( aNumber );
  };

  p.float = function float( aNumber ) {
      return parseFloat( aNumber );
      /*
      return typeof aNumber == "string" ?
      p.float( aNumber.charCodeAt(0) ) :
      parseFloat( aNumber );
      */
  };

  p.byte = function byte( aNumber ) {
    return aNumber || 0;
  };
  
  p.random = function random( aMin, aMax ) {
    return arguments.length == 2 ?
      aMin + (Math.random() * (aMax - aMin)) :
      Math.random() * aMin;
  };

  // From: http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
  p.noise = function( x, y, z ) {
    return arguments.length >= 2 ?
      PerlinNoise_2D( x, y ) :
      PerlinNoise_2D( x, x );
  };

  function Noise(x, y) {
    var n = x + y * 57;
    n = (n<<13) ^ n;
    return Math.abs(1.0 - (((n * ((n * n * 15731) + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0));
  };

  function SmoothedNoise(x, y) {
    var corners = ( Noise(x-1, y-1)+Noise(x+1, y-1)+Noise(x-1, y+1)+Noise(x+1, y+1) ) / 16;
    var sides   = ( Noise(x-1, y)  +Noise(x+1, y)  +Noise(x, y-1)  +Noise(x, y+1) ) /  8;
    var center  =  Noise(x, y) / 4;
    return corners + sides + center;
  };

  function InterpolatedNoise(x, y) {
    var integer_X    = Math.floor(x);
    var fractional_X = x - integer_X;

    var integer_Y    = Math.floor(y);
    var fractional_Y = y - integer_Y;

    var v1 = SmoothedNoise(integer_X,     integer_Y);
    var v2 = SmoothedNoise(integer_X + 1, integer_Y);
    var v3 = SmoothedNoise(integer_X,     integer_Y + 1);
    var v4 = SmoothedNoise(integer_X + 1, integer_Y + 1);

    var i1 = Interpolate(v1 , v2 , fractional_X);
    var i2 = Interpolate(v3 , v4 , fractional_X);

    return Interpolate(i1 , i2 , fractional_Y);
  }

  function PerlinNoise_2D(x, y) {
      var total = 0;
      var p = 0.25;
      var n = 3;

      for ( var i = 0; i <= n; i++ ) {
          var frequency = Math.pow(2, i);
          var amplitude = Math.pow(p, i);

          total = total + InterpolatedNoise(x * frequency, y * frequency) * amplitude;
      }

      return total;
  }

  function Interpolate(a, b, x) {
    var ft = x * p.PI;
    var f = (1 - p.cos(ft)) * .5;
    return  a*(1-f) + b*f;
  }

  p.abs = function abs( aNumber ) {
    return Math.abs( aNumber );
  };
  
  p.cos = function cos( aNumber ) {
    return Math.cos( aNumber );
  };
  
  p.sin = function sin( aNumber ) {
    return Math.sin( aNumber );
  };
  
  p.pow = function pow( aNumber, aExponent ) {
    return Math.pow( aNumber, aExponent );
  };
  
  p.constrain = function constrain( aNumber, aMin, aMax ) {
    return Math.min( Math.max( aNumber, aMin ), aMax );
  };
  
  p.sqrt = function sqrt( aNumber ) {
    return Math.sqrt( aNumber );
  };
  
  p.atan2 = function atan2( aNumber, aNumber2 ) {
    return Math.atan2( aNumber, aNumber2 );
  };
  
  p.radians = function radians( aAngle ) {
    return ( aAngle / 180 ) * p.PI;
  };
  
  p.degrees = function degrees( aAngle ) {
    aAngle = ( aAngle * 180 ) / p.PI;  
    if (aAngle < 0) {aAngle = 360 + aAngle}    
    return aAngle;
  };
  
  p.size = function size( aWidth, aHeight ) {
    var fillStyle = curContext.fillStyle;
    var strokeStyle = curContext.strokeStyle;

    curElement.width = p.width = aWidth;
    curElement.height = p.height = aHeight;

    curContext.fillStyle = fillStyle;
    curContext.strokeStyle = strokeStyle;
  };
  
  p.noStroke = function noStroke() {
    doStroke = false;
  };
  
  p.noFill = function noFill() {
    doFill = false;
  };
  
  p.smooth = function smooth(){};
  
  p.noSmooth = function noSmooth(){
      
  };
  
  
  p.noLoop = function noLoop() {
    doLoop = false;
  };
  
  p.fill = function fill() {
    doFill = true;
    curContext.fillStyle = p.color.apply( this, arguments );    
  };
  
  p.stroke = function stroke() {
    doStroke = true;
    curContext.strokeStyle = p.color.apply( this, arguments );
  };

  p.strokeWeight = function strokeWeight( w ) {
    curContext.lineWidth = w;
  };
  
  p.point = function point( x, y ) {
    var oldFill = curContext.fillStyle;
    curContext.fillStyle = curContext.strokeStyle;
    curContext.fillRect( Math.round( x ), Math.round( y ), 1, 1 );
    curContext.fillStyle = oldFill;
  };

  p.get = function get( x, y ) {
    if ( arguments.length == 0 ) {
      var c = p.createGraphics( p.width, p.height );
      c.image( curContext, 0, 0 );
      return c;
    }

    if ( !getLoaded ) {
      getLoaded = buildImageObject( curContext.getImageData(0, 0, p.width, p.height) );
    }

    return getLoaded.get( x, y );
  };

  p.set = function set( x, y, obj ) {
    if ( obj && obj.img ) {
      p.image( obj, x, y );
    } else {
      var oldFill = curContext.fillStyle;
      var color = obj;
      curContext.fillStyle = color;
      curContext.fillRect( Math.round( x ), Math.round( y ), 1, 1 );
      curContext.fillStyle = oldFill;
    }
  };
  
  p.arc = function arc( x, y, width, height, start, stop ) {       if ( width <= 0 )
     return;

   if ( curEllipseMode == p.CORNER ) {
     x += width / 2;
     y += height / 2;
   }
      curContext.moveTo( x, y );
   curContext.beginPath();   
   curContext.arc( x, y, curEllipseMode == p.CENTER_RADIUS ? width : width/2, start, stop, false );

   if ( doStroke )
     curContext.stroke();

   curContext.lineTo( x, y );

   if ( doFill )
     curContext.fill();
   
   curContext.closePath();
  };
  
  p.line = function line( x1, y1, x2, y2 ) {   
    curContext.lineCap = "round";
    curContext.beginPath();
  
    curContext.moveTo( x1 || 0, y1 || 0 );
    curContext.lineTo( x2 || 0, y2 || 0 );
    
    curContext.stroke();
    
    curContext.closePath();
  };

  p.bezier = function bezier( x1, y1, x2, y2, x3, y3, x4, y4 ) {
    curContext.lineCap = "butt";
    curContext.beginPath();
  
    curContext.moveTo( x1, y1 );
    curContext.bezierCurveTo( x2, y2, x3, y3, x4, y4 );
    
    curContext.stroke();
    
    curContext.closePath();
  };

  p.triangle = function triangle( x1, y1, x2, y2, x3, y3 ) {
    p.beginShape();
    p.vertex( x1, y1 );
    p.vertex( x2, y2 );
    p.vertex( x3, y3 );
    p.endShape();
  };

  p.quad = function quad( x1, y1, x2, y2, x3, y3, x4, y4 ) {
    curContext.lineCap = "square";
    p.beginShape();
    p.vertex( x1, y1 );
    p.vertex( x2, y2 );
    p.vertex( x3, y3 );
    p.vertex( x4, y4 );
    p.endShape();
  };
  
  p.rect = function rect( x, y, width, height ) {
    if ( width == 0 && height == 0 )
      return;

    curContext.beginPath();
    
    var offsetStart = 0;
    var offsetEnd = 0;

    if ( curRectMode == p.CORNERS ) {
      width -= x;
      height -= y;
    }
    
    if ( curRectMode == p.RADIUS ) {
      width *= 2;
      height *= 2;
    }
    
    if ( curRectMode == p.CENTER || curRectMode == p.RADIUS ) {
      x -= width / 2;
      y -= height / 2;
    }
  
    curContext.rect(
      Math.round( x ) - offsetStart,
      Math.round( y ) - offsetStart,
      Math.round( width ) + offsetEnd,
      Math.round( height ) + offsetEnd
    );
      
    if ( doFill )
      curContext.fill();
      
    if ( doStroke )
      curContext.stroke();
    
    curContext.closePath();
  };
  
  p.ellipse = function ellipse( x, y, width, height ) {
    x = x || 0;
    y = y || 0;

    if ( width <= 0 && height <= 0 )
      return;

    curContext.beginPath();
    
    if ( curEllipseMode == p.RADIUS ) {
      width *= 2;
      height *= 2;
    }     
    
    var offsetStart = 0;
    
    // Shortcut for drawing a circle
    if ( width == height ) {
      curContext.arc( x - offsetStart, y - offsetStart, width / 2, 0, Math.PI * 2, false );
    } else {
      var w = width/2;
      var h = height/2;
      var C = 0.5522847498307933;
      var c_x = C * w;
      var c_y = C * h;
      curContext.moveTo(x+w, y);
      curContext.bezierCurveTo(x+w, y-c_y, x+c_x, y-h, x, y-h);
      curContext.bezierCurveTo(x-c_x, y-h, x-w, y-c_y, x-w, y);
      curContext.bezierCurveTo(x-w, y+c_y, x-c_x, y+h, x, y+h);
      curContext.bezierCurveTo(x+c_x, y+h, x+w, y+c_y, x+w, y);
    }
  
    if ( doFill )
      curContext.fill();
      
    if ( doStroke )
      curContext.stroke();
    
    curContext.closePath();
  };

  p.cursor = function(mode){
    document.body.style.cursor=mode;
  }

  p.link = function( href, target ) {
    window.location = href;
  };

  p.loadPixels = function() {
    p.pixels = buildImageObject( curContext.getImageData(0, 0, p.width, p.height) ).pixels;
  };

  p.updatePixels = function() {
    var colors = /(\d+),(\d+),(\d+),(\d+)/;
    var pixels = {};
    pixels.width = p.width;
    pixels.height = p.height;
    pixels.data = [];

    if ( curContext.createImageData ) {
      pixels = curContext.createImageData( p.width, p.height );
    }

    var data = pixels.data;
    var pos = 0;

    for ( var i = 0, l = p.pixels.length; i < l; i++ ) {
      var c = (p.pixels[i] || "rgba(0,0,0,1)").match(colors);
      data[pos] = parseInt(c[1]);
      data[pos+1] = parseInt(c[2]);
      data[pos+2] = parseInt(c[3]);
      data[pos+3] = parseFloat(c[4]) * 255; // changed to 255 - F1LT3R 08.11.15
      pos += 4;
    }

    curContext.putImageData(pixels, 0, 0);
  };

  p.extendClass = function extendClass( obj, args, fn ) {
    if ( arguments.length == 3 ) {
      fn.apply( obj, args );
    } else {
      args.call( obj );
    }
  };

  p.addMethod = function addMethod( object, name, fn ) {
    if ( object[ name ] ) {
      var args = fn.length;
      
      var oldfn = object[ name ];
      object[ name ] = function() {
        if ( arguments.length == args )
          return fn.apply( this, arguments );
        else
          return oldfn.apply( this, arguments );
      };
    } else {
       object[ name ] = fn;
    }
  };

  p.init = function init(code){
    p.stroke( 0 );
    p.fill( 255 );
  
    // Canvas has trouble rendering single pixel stuff on whole-pixel
    // counts, so we slightly offset it (this is super lame).
     curContext.translate( 0.5, 0.5 );    
        
    if ( code ) {      
      (function(Processing){with (p){        
        eval(parse(code, p));        
      }})(p);      
    }
  
    if (p.setup) {
      inSetup = true;
      p.setup();
    }
    
    inSetup = false;
    
    if ( p.draw ) {
      if ( !doLoop ) {
        p.redraw();
      } else {
        p.loop();
      }
    }
    
    attach( curElement, "mousemove", function(e) {
      var scrollX = window.scrollX != null ? window.scrollX : window.pageXOffset;
      var scrollY = window.scrollY != null ? window.scrollY : window.pageYOffset;            
      p.pmouseX = p.mouseX;
      p.pmouseY = p.mouseY;
      p.mouseX = e.clientX - curElement.offsetLeft + scrollX;
      p.mouseY = e.clientY - curElement.offsetTop + scrollY;    

      if ( p.mouseMoved ) {
        p.mouseMoved();
      }

      if ( mousePressed && p.mouseDragged ) {
        p.mouseDragged();
      }    
    });
    
    attach( curElement, "mouseout", function(e) {
      p.cursor("auto");
    });
    
    attach( curElement, "mousedown", function(e) {
      mousePressed = true;
      switch(e.which){
        case 1: p.mouseButton = p.LEFT; break;
        case 2: p.mouseButton = p.CENTER; break;
        case 3: p.mouseButton = p.RIGHT; break; 
      }
      
      p.mouseDown = true;
      
      if ( typeof p.mousePressed == "function" ) {
        p.mousePressed();
      } else {
        p.mousePressed = true;
      }
    });

    attach( curElement, "contextmenu", function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    attach( curElement, "mouseup", function(e) {
      mousePressed = false;
      
      if ( p.mouseClicked ) {
        p.mouseClicked();
      }
      
      if ( typeof p.mousePressed != "function" ) {
        p.mousePressed = false;
      }

      if ( p.mouseReleased ) {
        p.mouseReleased();
      }
    });

    attach( document, "keydown", function(e) {
      keyPressed = true;

      p.key = e.keyCode + 32;
      
      var i; 
      for (i=0; i < p.codedKeys.length; i++){                                        
          if (p.key == p.codedKeys[i]){
            switch(p.key){
            case 70: p.keyCode = p.UP; break;
            case 71: p.keyCode = p.RIGHT; break;
            case 72: p.keyCode = p.DOWN; break;
            case 69: p.keyCode = p.LEFT; break;          
            }
            p.key=p.CODED;
          }
      }

      if ( e.shiftKey ) {
        p.key = String.fromCharCode(p.key).toUpperCase().charCodeAt(0);
      }

      if ( typeof p.keyPressed == "function" ) {
        p.keyPressed();
      } else {
        p.keyPressed = true;
      }
      
    });

    attach( document, "keyup", function(e) {
      keyPressed = false;

      if ( typeof p.keyPressed != "function" ) {
        p.keyPressed = false;
      }

      if ( p.keyReleased ) {
        p.keyReleased();
      }
    });

    function attach(elem, type, fn) {
      if ( elem.addEventListener )
        elem.addEventListener( type, fn, false );
      else
        elem.attachEvent( "on" + type, fn );
    }

  };

  return p;
}

})();