import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  TruckIcon, 
  FolderTree, 
  BarChart3,
  Settings,
  ShoppingCart,
  PackageOpen,
  PackageMinus,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNavigation() {
  const { isAdmin } = useAuth();

  const adminNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Products", url: "/products", icon: Package },
    { title: "Warehouse", url: "/warehouse", icon: Warehouse },
    { title: "Distribution", url: "/distribution", icon: TruckIcon },
    { title: "More", url: "/more", icon: MoreHorizontal },
  ];

  const riderNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "POS", url: "/pos", icon: ShoppingCart },
    { title: "Inventory", url: "/my-inventory", icon: PackageOpen },
    { title: "Return", url: "/returns", icon: PackageMinus },
  ];

  const navItems = isAdmin ? adminNavItems : riderNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
