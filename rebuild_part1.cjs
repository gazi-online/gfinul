
const fs = require('fs');
const orig = fs.readFileSync('src/components/AdminManagementDashboard.tsx', 'utf8');
const lines = orig.split('\n');
// Keep lines 1-837 (logic), replace 838-end with new sidebar render
const top = lines.slice(0, 837).join('\n');

// Add sidebarOpen state import note - we need to add useState for sidebarOpen
// We'll inject it at line 274 after activeTab state
const topWithSidebar = top.replace(
  "const [activeTab, setActiveTab] = useState<AdminTab>('overview')",
  "const [activeTab, setActiveTab] = useState<AdminTab>('overview')\n  const [sidebarOpen, setSidebarOpen] = useState(true)\n  const [searchQuery, setSearchQuery] = useState('')\n  const [currentTime, setCurrentTime] = useState(new Date())"
).replace(
  "import {\n  BarChart3,\n  Boxes,\n  ClipboardList,\n  MessageSquare,\n  PackageCheck,\n  RefreshCw,\n  ShieldCheck,\n  ShoppingBag,\n  Users,\n  X,\n} from 'lucide-react'",
  "import {\n  BarChart3,\n  Bell,\n  Boxes,\n  ClipboardList,\n  Menu,\n  MessageSquare,\n  PackageCheck,\n  RefreshCw,\n  Search,\n  ShieldCheck,\n  ShoppingBag,\n  TrendingUp,\n  Users,\n  X,\n} from 'lucide-react'"
);

// Write part1 to a temp file
fs.writeFileSync('src/components/AdminManagementDashboard.tsx.part1', topWithSidebar);
console.log('Part1 written, lines:', topWithSidebar.split('\n').length);
