import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: riderInventory } = useQuery({
    queryKey: ['rider_inventory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_inventory')
        .select('*, products(id, name, price, sku)')
        .eq('rider_id', user?.id!)
        .gt('quantity', 0);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: taxSettings } = useQuery({
    queryKey: ['tax_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          rider_id: user?.id,
          transaction_number: `TRX-${Date.now()}`,
          total_amount: transaction.total_amount,
          tax_amount: transaction.tax_amount,
          final_amount: transaction.final_amount,
          payment_method: transaction.payment_method,
        })
        .select()
        .single();

      if (txError) throw txError;

      const items = cart.map(item => ({
        transaction_id: txData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Update rider inventory
      for (const item of cart) {
        // Get current quantity
        const { data: currentInv } = await supabase
          .from('rider_inventory')
          .select('quantity')
          .eq('rider_id', user?.id)
          .eq('product_id', item.product_id)
          .single();

        if (currentInv) {
          const newQuantity = Math.max(0, currentInv.quantity - item.quantity);
          const { error } = await supabase
            .from('rider_inventory')
            .update({ quantity: newQuantity })
            .eq('rider_id', user?.id)
            .eq('product_id', item.product_id);
          if (error) console.error('Inventory update error:', error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider_inventory'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Transaksi berhasil");
      setCart([]);
      setSelectedProduct("");
      setQuantity(1);
    },
    onError: () => toast.error("Gagal membuat transaksi")
  });

  const addToCart = () => {
    if (!selectedProduct) return;

    const product = riderInventory?.find(inv => inv.products?.id === selectedProduct);
    if (!product || !product.products) return;

    const existingItem = cart.find(item => item.product_id === selectedProduct);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === selectedProduct
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.products.id,
        product_name: product.products.name,
        unit_price: Number(product.products.price),
        quantity,
        subtotal: quantity * Number(product.products.price)
      }]);
    }

    setSelectedProduct("");
    setQuantity(1);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = taxSettings?.is_active ? (totalAmount * Number(taxSettings.tax_rate)) / 100 : 0;
  const finalAmount = totalAmount + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    createTransactionMutation.mutate({
      total_amount: totalAmount,
      tax_amount: taxAmount,
      final_amount: finalAmount,
      payment_method: paymentMethod,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">POS</h1>
          <p className="text-muted-foreground">Point of Sale - Sistem penjualan</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Produk</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {riderInventory && riderInventory.length > 0 ? (
                      riderInventory.map((inv) => (
                        <SelectItem key={inv.products?.id} value={inv.products?.id || ''}>
                          {inv.products?.name} - Rp {Number(inv.products?.price).toLocaleString('id-ID')} (Stok: {inv.quantity})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        Tidak ada produk tersedia
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                />
              </div>
              <Button onClick={addToCart} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah ke Keranjang
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Keranjang kosong</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => removeFromCart(item.product_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                    {taxSettings?.is_active && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>{taxSettings.tax_name} ({taxSettings.tax_rate}%):</span>
                        <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>Rp {finalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    Checkout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
