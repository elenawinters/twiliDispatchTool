Array.prototype.sample = function() {
    return this[Math.floor(Math.random()*this.length)];
}  // https://stackoverflow.com/a/33906108


Array.prototype.diff = function(arr2) { 
    return this.filter(x => !arr2.includes(x));
}  // https://stackoverflow.com/a/33034768/14125122

String.prototype.hashCode = function() {
  for(var i=0,h=9;i<this.length;)
      h=Math.imul(h^this.charCodeAt(i++),9**9);
  return h^h>>>9
} // https://stackoverflow.com/a/52171480/14125122
