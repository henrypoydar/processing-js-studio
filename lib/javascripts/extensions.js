function f(n) {    // Format integers to have at least two digits.
    return n < 10 ? '0' + n : n;
}

Date.prototype.rfc3339 = function() {
    return this.getUTCFullYear()   + '-' +
         f(this.getUTCMonth() + 1) + '-' +
         f(this.getUTCDate())      + 'T' +
         f(this.getUTCHours())     + ':' +
         f(this.getUTCMinutes())   + ':' +
         f(this.getUTCSeconds())   + 'Z';
};

// This is a format that collates in order and tends to work with
// JavaScript's new Date(string) date parsing capabilities, unlike rfc3339.
Date.prototype.toJSON = function() {
    return this.getUTCFullYear()   + '/' +
         f(this.getUTCMonth() + 1) + '/' +
         f(this.getUTCDate())      + ' ' +
         f(this.getUTCHours())     + ':' +
         f(this.getUTCMinutes())   + ':' +
         f(this.getUTCSeconds())   + ' +0000';
};

Array.prototype.unique = function() {
  var a = [];
  var l = this.length;
  for(var i=0; i<l; i++) {
    for(var j=i+1; j<l; j++) {
      // If this[i] is found later in the array
      if (this[i] === this[j])
        j = ++i;
    }
    a.push(this[i]);
  }
  return a;
};

String.prototype.blank = function() {
  return /^\s*$/.test(this);
};

String.prototype.chomp = function() {
  return this.replace(/(\n|\r)+$/, '');
}

String.prototype.cssify = function() {
  var res = this;
  res = res.replace(/\?|\.|\ /g, '-');
  res = res.replace(/\#|\//g, '');
  return res;
}

String.prototype.trim = function() {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

// From Futon
function encodeDocId(docid) {
  var encoded, parts = docid.split('/');
  if (parts[0] == '_design') {
    parts.shift();
    encoded = encodeURIComponent(parts.join('/'));
    return '_design/' + encoded;
  } else {
    return encodeURIComponent(docid);
  }
};
function encodeAttachment(name) {
  var encoded = [], parts = name.split('/');
  for (var i=0; i < parts.length; i++) {
    encoded.push(encodeURIComponent(parts[i]));
  };
  return encoded.join('/');
};


