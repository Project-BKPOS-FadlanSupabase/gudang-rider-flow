import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderTree, BarChart3, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";

export default function More() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  if (!isAdmin) {
    return null;
  }

  const adminMenuItems = [
    {
      title: "Kategori",
      description: "Kelola kategori produk",
      icon: FolderTree,
      url: "/categories",
    },
    {
      title: "Laporan",
      description: "Lihat laporan penjualan dan inventori",
      icon: BarChart3,
      url: "/reports",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Lainnya</h1>
          <p className="text-muted-foreground">Akses fitur tambahan admin</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {adminMenuItems.map((item) => (
            <Link key={item.url} to={item.url}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <LogOut className="h-5 w-5" />
              Logout
            </CardTitle>
            <CardDescription>Keluar dari akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
