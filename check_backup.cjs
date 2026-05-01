const fs = require('fs');

// Read UTF-16 backup
const buf = fs.readFileSync('src/components/AdminManagementDashboard.tsx.bak');
const c = buf.toString('utf16le').replace(/\r\n/g, '\n');

// Search for tab content patterns in backup
var tabs = ['overview', 'products', 'inventory', 'users', 'orders', 'requests', 'messages'];
for (var t = 0; t < tabs.length; t++) {
  var tab = tabs[t];
  var marker = "activeTab === '" + tab + "'";
  var idx = c.indexOf(marker);
  if (idx === -1) {
    console.log('NOT FOUND:', tab);
    continue;
  }
  // Find the ( after &&
  var i = idx + marker.length;
  while (i < c.length && c[i] !== '(') i++;
  // Check char count
  var depth = 0;
  var end = -1;
  for (var j = i; j < c.length; j++) {
    if (c[j] === '(') depth++;
    else if (c[j] === ')') { depth--; if (depth === 0) { end = j; break; } }
  }
  console.log(tab, '- found at idx', idx, '- chars:', (end - i), '- marker context:', c.slice(idx, idx + 60));
}
