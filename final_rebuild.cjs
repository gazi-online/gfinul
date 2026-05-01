const fs = require('fs');

const curr = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const currLines = curr.split('\n');

const buf = fs.readFileSync('src/components/AdminManagementDashboard.tsx.bak');
const bak = buf.toString('utf16le').replace(/\r\n/g, '\n');

const renderTop = fs.readFileSync('render_top.txt', 'utf8');
const renderBottom = fs.readFileSync('render_bottom.txt', 'utf8');

// Helper: extract a ( ... ) block starting at given index
function extractParens(text, startIdx) {
  var i = startIdx;
  while (i < text.length && text[i] !== '(') i++;
  var depth = 0, end = -1;
  for (var j = i; j < text.length; j++) {
    if (text[j] === '(') depth++;
    else if (text[j] === ')') { depth--; if (depth === 0) { end = j; break; } }
  }
  return end === -1 ? null : text.slice(i, end + 1);
}

// Helper: extract tab from current file (already has && pattern)
function extractFromCurr(tab) {
  var marker = "activeTab === '" + tab + "' && ";
  var idx = curr.indexOf(marker);
  if (idx === -1) return null;
  var block = extractParens(curr, idx + marker.length);
  if (!block || block.length < 50) return null;
  return block;
}

// Helper: extract tab from backup (uses ternary ? pattern)
function extractFromBak(tab) {
  var marker = "activeTab === '" + tab + "' ? (";
  var idx = bak.indexOf(marker);
  if (idx === -1) {
    // try just the ternary without space
    marker = "activeTab === '" + tab + "'";
    idx = bak.indexOf(marker, bak.indexOf('return (', bak.indexOf('if (!isAdmin)')));
    if (idx === -1) return null;
    // Find the ( for the content
    var colonIdx = bak.indexOf('? (', idx);
    if (colonIdx === -1 || colonIdx - idx > 100) return null;
    var block = extractParens(bak, colonIdx + 2);
    return block && block.length > 50 ? block : null;
  }
  var block = extractParens(bak, idx + marker.length - 1);
  return block && block.length > 50 ? block : null;
}

// Get all 7 tab blocks
var overview  = extractFromBak('overview')  || extractFromCurr('overview');
var products  = extractFromCurr('products') || extractFromBak('products');
var inventory = extractFromCurr('inventory')|| extractFromBak('inventory');
var users     = extractFromCurr('users')    || extractFromBak('users');
var orders    = extractFromCurr('orders')   || extractFromBak('orders');
var requests  = extractFromBak('requests')  || extractFromCurr('requests');
var messages  = extractFromCurr('messages') || extractFromBak('messages');

console.log('overview :', overview  ? overview.length  : 'MISSING');
console.log('products :', products  ? products.length  : 'MISSING');
console.log('inventory:', inventory ? inventory.length : 'MISSING');
console.log('users    :', users     ? users.length     : 'MISSING');
console.log('orders   :', orders    ? orders.length    : 'MISSING');
console.log('requests :', requests  ? requests.length  : 'MISSING');
console.log('messages :', messages  ? messages.length  : 'MISSING');

// Keep only logic section (lines 1-837) from current file
var top = currLines.slice(0, 837).join('\n');

// Build tab content section with && pattern
function wrap(tab, block) {
  if (!block) return '            {/* ' + tab + ' tab content missing */}\n';
  return '            {activeTab === \'' + tab + '\' && ' + block + '}\n';
}

var tabContent = wrap('overview', overview)
  + wrap('products', products)
  + wrap('inventory', inventory)
  + wrap('users', users)
  + wrap('orders', orders)
  + wrap('requests', requests)
  + wrap('messages', messages);

var finalContent = top + '\n' + renderTop + '\n' + tabContent + '\n' + renderBottom;

fs.writeFileSync('src/components/AdminManagementDashboard.tsx', finalContent, 'utf8');
console.log('Done! Total lines:', finalContent.split('\n').length);
console.log('Last 5 lines:', finalContent.split('\n').slice(-5).join('\n'));
