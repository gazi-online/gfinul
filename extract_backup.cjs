const fs = require('fs');

// Read current file and backup
const curr = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const buf = fs.readFileSync('src/components/AdminManagementDashboard.tsx.bak');
const bak = buf.toString('utf16le').replace(/\r\n/g, '\n');

// ── Extract OVERVIEW from backup (uses ternary: activeTab === 'overview' ? ()
var ovMarker = "activeTab === 'overview' ? (";
var ovIdx = bak.indexOf(ovMarker);
var ovStart = ovIdx + ovMarker.length - 1; // include the '('
var depth = 0, ovEnd = -1;
for (var j = ovStart; j < bak.length; j++) {
  if (bak[j] === '(') depth++;
  else if (bak[j] === ')') { depth--; if (depth === 0) { ovEnd = j; break; } }
}
var overviewBlock = bak.slice(ovStart, ovEnd + 1);
console.log('Overview extracted chars:', overviewBlock.length);

// ── Extract working tabs from current file
function extractBlock(text, tab) {
  var marker = "activeTab === '" + tab + "' && ";
  var idx = text.indexOf(marker);
  if (idx === -1) return null;
  // skip to the (
  var i = idx + marker.length;
  while (i < text.length && text[i] !== '(') i++;
  var depth = 0, end = -1;
  for (var j = i; j < text.length; j++) {
    if (text[j] === '(') depth++;
    else if (text[j] === ')') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end === -1 || (end - i) < 50) return null;
  return text.slice(i, end + 1);
}

var products = extractBlock(curr, 'products');
var inventory = extractBlock(curr, 'inventory');
var users = extractBlock(curr, 'users');
var orders = extractBlock(curr, 'orders');
var messages = extractBlock(curr, 'messages');
console.log('products:', products ? products.length : 'MISSING');
console.log('inventory:', inventory ? inventory.length : 'MISSING');
console.log('users:', users ? users.length : 'MISSING');
console.log('orders:', orders ? orders.length : 'MISSING');
console.log('messages:', messages ? messages.length : 'MISSING');

// ── Also look for requests in backup render section (search after return statement)
var returnIdx = bak.indexOf('return (', bak.indexOf('if (!isAdmin)'));
var renderSection = bak.slice(returnIdx);
var reqMarker = "activeTab === 'requests'";
// Try different patterns
var rIdx = renderSection.indexOf(reqMarker);
console.log('requests in backup render section at offset:', rIdx);
if (rIdx !== -1) {
  console.log('context:', renderSection.slice(rIdx, rIdx + 200));
}

// Also try looking for ServiceRequest JSX in the backup
var svcIdx = bak.indexOf('<ServiceRequest');
var svcIdx2 = bak.indexOf('requests.map');
console.log('requests.map in backup at:', svcIdx2, svcIdx2 > 0 ? 'context: ' + bak.slice(svcIdx2, svcIdx2 + 100) : '');
