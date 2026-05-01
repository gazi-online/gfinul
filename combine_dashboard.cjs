const fs = require('fs');

// Read all source files
const orig = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const renderTop = fs.readFileSync('render_top.txt', 'utf8');
const renderBottom = fs.readFileSync('render_bottom.txt', 'utf8');

const lines = orig.split('\n');

// Keep lines 1-837 (all logic, state, handlers — stop before old if(!isAdmin) guard)
const top = lines.slice(0, 837).join('\n');

// The old render section (from line 838 onward — includes the if(!isAdmin) and return)
const oldRender = lines.slice(837).join('\n');

// Extract tab content blocks using string matching (no template literals)
function extractTabBlocks(text) {
  var result = '';
  var tabs = ['overview', 'products', 'inventory', 'users', 'orders', 'requests', 'messages'];

  for (var t = 0; t < tabs.length; t++) {
    var tab = tabs[t];
    var marker = "activeTab === '" + tab + "'";
    var idx = text.indexOf(marker);
    if (idx === -1) {
      console.log('Tab not found:', tab);
      continue;
    }

    // Find the '(' that follows '&&'
    var i = idx + marker.length;
    while (i < text.length && text[i] !== '(') i++;
    if (i >= text.length) continue;

    // Find matching closing ')'
    var depth = 0;
    var end = -1;
    for (var j = i; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end === -1) {
      console.log('Could not find end for tab:', tab);
      continue;
    }

    var block = '            {' + marker + ' && ' + text.slice(i, end + 1) + '}\n';
    result += block;
    console.log('Extracted tab:', tab, '- chars:', (end - i));
  }
  return result;
}

var tabBlocks = extractTabBlocks(oldRender);
console.log('Tab blocks length:', tabBlocks.length);

var finalContent = top + '\n' + renderTop + '\n' + tabBlocks + '\n' + renderBottom;

fs.writeFileSync('src/components/AdminManagementDashboard.tsx', finalContent, 'utf8');

var resultLines = finalContent.split('\n').length;
console.log('Done! Total lines:', resultLines);
console.log('Last 8 lines:');
console.log(finalContent.split('\n').slice(-8).join('\n'));
