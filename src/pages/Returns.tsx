import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { PackageMinus } from "lucide-react";

const returnReasons = [
  { value: "reject", label: "Reject (produk rusak)" },
  { value: "defective", label: "Produk cacat (kadaluarsa)" },
  { value: "unsold", label: "Produk tidak terjual" },
];

export default function Returns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  // Fetch rider's inventory
  const { data: inventory } = useQuery({
    queryKey: ["rider-inventory", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_inventory")
        .select("*, products(*)")
        .eq("rider_id", user?.id || "")
        .gt("quantity", 0);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch return history
  const { data: returns } = useQuery({
    queryKey: ["returns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("returns")
        .select("*, products(*)")
        .eq("rider_id", user?.id || "")
        .order("returned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: async (returnData: { product_id: string; quantity: number; reason: string }) => {
      const { data, error } = await supabase
        .from("returns")
        .insert([
          {
            rider_id: user?.id,
            product_id: returnData.product_id,
            quantity: returnData.quantity,
            reason: returnData.reason,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("Produk berhasil dikembalikan ke gudang");
      setOpen(false);
      setSelectedProduct("");
      setQuantity("");
      setReason("");
    },
    onError: (error) => {
      toast.error("Gagal mengembalikan produk: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedInventory = inventory?.find(item => item.product_id === selectedProduct);
    const quantityNum = parseInt(quantity);

    if (!selectedProduct || !quantity || !reason) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    if (quantityNum <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    if (selectedInventory && quantityNum > selectedInventory.quantity) {
      toast.error(`Jumlah melebihi stok tersedia (${selectedInventory.quantity})`);
      return;
    }

    createReturnMutation.mutate({
      product_id: selectedProduct,
      quantity: quantityNum,
      reason: reason,
    });
  };

  const getReasonLabel = (reasonValue: string) => {
    return returnReasons.find(r => r.value === reasonValue)?.label || reasonValue;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Return Produk</h1>
            <p className="text-muted-foreground">Kembalikan produk ke gudang</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PackageMinus className="h-4 w-4 mr-2" />
                Return Produk
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Return Produk ke Gudang</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Produk</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory?.map((item) => (
                        <SelectItem key={item.product_id} value={item.product_id}>
                          {item.products.name} (Stok: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Masukkan jumlah"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alasan</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih alasan" />
                    </SelectTrigger>
                    <SelectContent>
                      {returnReasons.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Return Produk
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Return</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns?.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell>{format(new Date(returnItem.returned_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>{returnItem.products?.name}</TableCell>
                    <TableCell>{returnItem.quantity}</TableCell>
                    <TableCell>{getReasonLabel(returnItem.reason || "")}</TableCell>
                  </TableRow>
                ))}
                {!returns || returns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada riwayat return
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
