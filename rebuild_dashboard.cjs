const fs = require('fs');
const orig = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const lines = orig.split('\n');
// Keep lines 1-838 (all logic/state), replace from 'return (' onward
const top = lines.slice(0, 838).join('\n');

const newRender = `
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">Access denied</h2>
          <p className="mt-2 text-sm text-gray-500">You do not have permission to open the admin console.</p>
          <button onClick={onClose} className="mt-6 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">Return</button>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: BarChart3 },
    { id: 'products' as AdminTab, label: 'Products', icon: ShoppingBag },
    { id: 'inventory' as AdminTab, label: 'Inventory', icon: Boxes },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'orders' as AdminTab, label: 'Orders', icon: PackageCheck },
    { id: 'requests' as AdminTab, label: 'Requests', icon: ClipboardList },
    { id: 'messages' as AdminTab, label: 'Messages', icon: MessageSquare },
  ]

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex h-full w-full overflow-hidden bg-[#f8f4f1] font-sans">
      <style>{\`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@300;400;500;600;700;800&display=swap');
        .admin-wrap * { font-family: 'Work Sans', sans-serif; }
        .heading-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-in-right { animation: slideInRight 0.5s ease-out forwards; }
        .animate-slide-in-up { animation: slideInUp 0.4s ease-out forwards; }
        .admin-stat-card { position:relative; overflow:hidden; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); background:white; box-shadow:0 1px 3px rgba(0,0,0,0.08); border-radius:16px; }
        .admin-stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.12); }
        .admin-nav-item { transition:all 0.2s ease; position:relative; color:#64748b; width:100%; text-align:left; display:flex; align-items:center; gap:12px; padding:10px 16px; border-radius:10px; font-size:0.875rem; font-weight:500; }
        .admin-nav-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#FF6B35; transform:scaleY(0); transition:transform 0.2s ease; border-radius:0 4px 4px 0; }
        .admin-nav-item:hover::before, .admin-nav-item.active::before { transform:scaleY(1); }
        .admin-nav-item:hover { background:rgba(255,107,53,0.08); color:#1e293b; }
        .admin-nav-item.active { background:rgba(255,107,53,0.12); color:#FF6B35; font-weight:600; }
        .admin-sidebar-bg { background:linear-gradient(180deg,#fff 0%,#fff5f2 100%); border-right:2px solid #ffe0d6; }
        .admin-search-glow:focus { box-shadow:0 0 0 3px rgba(255,107,53,0.15); border-color:#FF6B35; outline:none; }
        .admin-content { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
        .admin-main { flex:1; overflow-y:auto; padding:24px; }
        .admin-section { animation: slideInUp 0.4s ease-out forwards; }
      \`}</style>

      {/* Sidebar */}
      <aside className="admin-sidebar-bg flex-shrink-0 w-64 h-full flex flex-col z-10 shadow-lg">
        <div className="p-6 border-b border-orange-200">
          <h1 className="heading-font text-3xl text-orange-600" style={{textShadow:'0 2px 8px rgba(255,107,53,0.3)'}}>GAZI ONLINE</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">Admin Dashboard</p>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={\`admin-nav-item \${activeTab === item.id ? 'active' : ''}\`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-orange-100">
          <button onClick={onClose} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
            <X size={16} />
            Close Dashboard
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content admin-wrap">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab === 'overview' ? 'Dashboard Overview' : activeTab}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors shadow-sm">
              <RefreshCw size={15} />
              Refresh
            </button>
            {loading && <span className="text-xs text-orange-500 font-medium animate-pulse">Loading…</span>}
          </div>
        </header>

        {/* Tab content */}
        <main className="admin-main">
`;

// Now we need to embed the existing tab content from lines 839-end
// Find the line after 'return (' that contains the actual tab-switching JSX
// We grab lines 839 onward until we find the old layout wrapper, then take inner content
// Strategy: find where the old content divs are and splice them in

// The old file's return section starts rendering content inside a fixed wrapper.
// We need to extract just the tab-panel content portions.
// Let's look for the renderTab / tab content area in the old render.

// Read the original lines 839 to end
const oldRender = lines.slice(838).join('\n');

// Find the content block - in the old file the tab switcher is a div with the content
// We'll extract everything between the main content area
// The old file has: activeTab === 'overview' && (...) etc
// We need these blocks. Let's find them by searching for tab condition patterns

const tabSections = [];
const tabIds = ['overview','products','inventory','users','orders','requests','messages'];

for (const tab of tabIds) {
  // Find pattern like: activeTab === 'tab' && (
  const startMarker = \`activeTab === '\${tab}'\`;
  const idx = oldRender.indexOf(startMarker);
  if (idx === -1) continue;
  
  // Find the opening paren after &&
  let i = idx + startMarker.length;
  while (i < oldRender.length && oldRender[i] !== '(') i++;
  if (i >= oldRender.length) continue;
  
  // Now find matching closing paren
  let depth = 0;
  let start = i;
  let end = -1;
  for (let j = start; j < oldRender.length; j++) {
    if (oldRender[j] === '(') depth++;
    else if (oldRender[j] === ')') {
      depth--;
      if (depth === 0) { end = j; break; }
    }
  }
  if (end === -1) continue;
  tabSections.push({ tab, content: oldRender.slice(idx, end+1) });
}

// Build the content area with extracted tab sections
let contentArea = '';
for (const s of tabSections) {
  contentArea += `          {${s.content}}\n`;
}

const footer = `
        </main>
      </div>

      {/* Reply modal - keep from old render */}
      {replyModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Reply to message</h3>
              <button onClick={() => setReplyModal(null)} className="rounded-full p-1 hover:bg-gray-100 transition-colors"><X size={18} /></button>
            </div>
            <div className="mb-4 rounded-xl bg-orange-50 border border-orange-100 p-4">
              <p className="text-sm font-semibold text-slate-700">{replyModal.msg.name} <span className="font-normal text-slate-500">({replyModal.msg.email})</span></p>
              <p className="mt-2 text-sm text-slate-600">{replyModal.msg.message}</p>
            </div>
            <textarea
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 min-h-[100px] resize-none"
              placeholder="Type your reply…"
              value={replyModal.text}
              onChange={(e) => setReplyModal((prev) => prev ? { ...prev, text: e.target.value } : prev)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setReplyModal(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSendReply} disabled={isSendingReply} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center gap-2">
                {isSendingReply ? (<><svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>) : 'Save Reply'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminManagementDashboard
`;

const finalContent = top + '\n' + newRender + '\n' + contentArea + '\n' + footer;

fs.writeFileSync('src/components/AdminManagementDashboard.tsx', finalContent, 'utf8');
const result = fs.readFileSync('src/components/AdminManagementDashboard.tsx','utf8');
console.log('Done! Total lines:', result.split('\n').length);
console.log('Last 5 lines:', result.split('\n').slice(-5).join('\n'));
