
const fs = require('fs');
const orig = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const lines = orig.split('\n');
// Keep lines 1-14 (imports) but add recharts + new lucide icons
const newImports = `import React, { useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  Menu,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { productsApi, type ProductPayload } from '../api/products'
import { usersApi } from '../api/users'
import { ordersApi } from '../api/orders'
import { servicesApi } from '../api/services'
import { contactApi } from '../api/contact'
import { type AppUser, type Order, type Product, type ServiceRequest } from '../lib/types'
import { uploadImageToCloudinary } from '../lib/cloudinary'
import { useToast } from './toast/useToast'`;

// Lines 23-837 (types, consts, helpers, state, handlers) - keep as-is
const middlePart = lines.slice(22, 837).join('\n');

const newStyles = `
const ADMIN_STYLES = \`
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Work+Sans:wght@300;400;500;600;700&display=swap');
  * { font-family: 'Work Sans', sans-serif; }
  .heading-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
  @keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .animate-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
  .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
  .stat-card { position:relative; overflow:hidden; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
  .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.12); }
  .glass-effect { background:white; box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.06); }
  .nav-item { transition:all 0.2s ease; position:relative; color:#475569; }
  .nav-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#FF6B35; transform:scaleY(0); transition:transform 0.2s ease; border-radius:0 4px 4px 0; }
  .nav-item:hover::before, .nav-item.active::before { transform:scaleY(1); }
  .nav-item:hover { background:rgba(255,107,53,0.08); color:#1e293b; }
  .nav-item.active { background:rgba(255,107,53,0.12); color:#FF6B35; font-weight:600; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
  .status-completed { background:rgba(0,168,107,0.15); color:#00753d; border:1px solid rgba(0,168,107,0.3); }
  .status-pending { background:rgba(247,147,30,0.15); color:#c5740a; border:1px solid rgba(247,147,30,0.3); }
  .status-processing { background:rgba(78,205,196,0.15); color:#2d8b84; border:1px solid rgba(78,205,196,0.3); }
  .status-shipped { background:rgba(99,102,241,0.15); color:#4338ca; border:1px solid rgba(99,102,241,0.3); }
  .status-delivered { background:rgba(0,168,107,0.15); color:#00753d; border:1px solid rgba(0,168,107,0.3); }
  .status-cancelled, .status-rejected { background:rgba(244,63,94,0.15); color:#be123c; border:1px solid rgba(244,63,94,0.3); }
  .metric-number { font-variant-numeric:tabular-nums; }
  .sidebar-bg { background:linear-gradient(180deg,#fff 0%,#fef3f0 100%); border-right:2px solid #ffe8e0; }
  .scrollbar-none::-webkit-scrollbar { display:none; } .scrollbar-none { -ms-overflow-style:none; scrollbar-width:none; }
\``;

fs.writeFileSync('build_admin_part1.txt', newImports + '\n\n' + middlePart + '\n' + newStyles + '\n', 'utf8');
console.log('Part1 written, lines:', (newImports + middlePart + newStyles).split('\n').length);
