import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  Warehouse,
  TruckIcon,
  FolderTree,
  ShoppingCart,
  PackageMinus
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";

const adminMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produk", url: "/products", icon: Package },
  { title: "Gudang", url: "/warehouse", icon: Warehouse },
  { title: "Distribusi", url: "/distribution", icon: TruckIcon },
  { title: "Kategori", url: "/categories", icon: FolderTree },
  { title: "Laporan", url: "/reports", icon: FileText },
  { title: "Pengaturan", url: "/settings", icon: Settings },
];

const riderMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "POS", url: "/pos", icon: ShoppingCart },
  { title: "Produk Saya", url: "/my-inventory", icon: Package },
  { title: "Return Produk", url: "/returns", icon: PackageMinus },
  { title: "Pengaturan", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const menuItems = isAdmin ? adminMenuItems : riderMenuItems;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sidebar-primary p-2">
            <Package className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {open && (
            <div>
              <h1 className="font-bold text-sidebar-foreground">POS System</h1>
              <p className="text-xs text-sidebar-foreground/60">Warehouse Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {profile?.role}
              </p>
            </div>
          )}
        </div>
        {open && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start mt-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
