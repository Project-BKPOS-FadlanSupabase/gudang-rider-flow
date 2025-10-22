import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Plus, Pencil, TruckIcon, PackageMinus, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function WarehousePage() {
  const [open, setOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: warehouseStock, isLoading } = useQuery({
    queryKey: ['warehouse_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select('*, products(name, sku)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: distributions } = useQuery({
    queryKey: ['distributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select('*, products(name, sku), profiles!distributions_rider_id_fkey(full_name)')
        .order('distributed_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: pendingReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['pending_returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*, products(name, sku), profiles!returns_rider_id_fkey(full_name)')
        .eq('status', 'pending')
        .order('returned_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const approveReturnMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const { error } = await supabase
        .from('returns')
        .update({ status: 'approved' })
        .eq('id', returnId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_returns'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock'] });
      toast.success("Return disetujui, stok telah dikembalikan ke gudang");
    },
    onError: () => toast.error("Gagal menyetujui return")
  });

  const upsertMutation = useMutation({
    mutationFn: async (stock: any) => {
      const { error } = await supabase.from('warehouse_stock').upsert(stock);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock'] });
      toast.success("Stok berhasil diupdate");
      setOpen(false);
      setEditingStock(null);
    },
    onError: () => toast.error("Gagal mengupdate stok")
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stock = {
      id: editingStock?.id,
      product_id: formData.get('product_id'),
      quantity: parseInt(formData.get('quantity') as string),
      min_stock: parseInt(formData.get('min_stock') as string),
    };

    upsertMutation.mutate(stock);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gudang</h1>
            <p className="text-muted-foreground">Kelola stok gudang</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingStock(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah/Update Stok
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStock ? 'Edit Stok' : 'Tambah Stok Produk'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Produk</Label>
                  <Select name="product_id" defaultValue={editingStock?.product_id} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah Stok</Label>
                  <Input id="quantity" name="quantity" type="number" defaultValue={editingStock?.quantity || 0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Stok Minimum</Label>
                  <Input id="min_stock" name="min_stock" type="number" defaultValue={editingStock?.min_stock || 10} required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingStock(null); }}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">
              <Warehouse className="h-4 w-4 mr-2" />
              Stok Gudang
            </TabsTrigger>
            <TabsTrigger value="distributions">
              <TruckIcon className="h-4 w-4 mr-2" />
              Distribusi
            </TabsTrigger>
            <TabsTrigger value="returns">
              <PackageMinus className="h-4 w-4 mr-2" />
              Return Produk
              {pendingReturns && pendingReturns.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingReturns.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Stok Gudang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Stok Tersedia</TableHead>
                        <TableHead>Stok Minimum</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseStock?.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-mono">{stock.products?.sku}</TableCell>
                          <TableCell>{stock.products?.name}</TableCell>
                          <TableCell>{stock.quantity}</TableCell>
                          <TableCell>{stock.min_stock}</TableCell>
                          <TableCell>
                            {stock.quantity <= stock.min_stock ? (
                              <span className="text-destructive font-medium">Stok Rendah</span>
                            ) : (
                              <span className="text-primary">Normal</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => { setEditingStock(stock); setOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  Riwayat Distribusi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions?.map((dist) => (
                      <TableRow key={dist.id}>
                        <TableCell className="font-mono">{dist.products?.sku}</TableCell>
                        <TableCell>{dist.products?.name}</TableCell>
                        <TableCell>{dist.profiles?.full_name}</TableCell>
                        <TableCell>{dist.quantity}</TableCell>
                        <TableCell>{format(new Date(dist.distributed_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell>{dist.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageMinus className="h-5 w-5" />
                  Return Produk Menunggu Persetujuan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {returnsLoading ? (
                  <p>Loading...</p>
                ) : pendingReturns && pendingReturns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Rider</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReturns.map((ret) => (
                        <TableRow key={ret.id}>
                          <TableCell className="font-mono">{ret.products?.sku}</TableCell>
                          <TableCell>{ret.products?.name}</TableCell>
                          <TableCell>{ret.profiles?.full_name}</TableCell>
                          <TableCell>{ret.quantity}</TableCell>
                          <TableCell>{ret.reason}</TableCell>
                          <TableCell>{format(new Date(ret.returned_at), 'dd MMM yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => approveReturnMutation.mutate(ret.id)}
                              disabled={approveReturnMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Setujui
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Tidak ada return produk yang menunggu persetujuan</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
