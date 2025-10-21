import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Package, TrendingUp, Users, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRange } from "react-day-picker";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: string;
  created_at: string;
  final_amount: number;
  total_amount: number;
  tax_amount: number;
  transaction_number: string;
  rider_id: string;
  payment_method: string;
}

interface ChartData {
  date: string;
  transactions: number;
  total_amount: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 9, 1), // October 1, 2025
    to: new Date(2025, 9, 17), // October 17, 2025 (current date)
  });

  // Fetch products data
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data;
    },
  });

  // Fetch transactions data using React Query
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', date?.from, date?.to],
    queryFn: async (): Promise<ChartData[]> => {
      if (!date?.from || !date?.to) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfDay(date.from).toISOString())
        .lte('created_at', endOfDay(date.to).toISOString());

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      // Group transactions by date
      const groupedData = data.reduce((acc, transaction) => {
        const dateKey = format(new Date(transaction.created_at), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = {
            transactions: 0,
            total_amount: 0,
          };
        }
        acc[dateKey].transactions += 1;
        acc[dateKey].total_amount += transaction.final_amount;
        return acc;
      }, {} as Record<string, Omit<ChartData, 'date'>>);

      // Convert to array format for the chart
      return Object.entries(groupedData).map(([date, data]) => ({
        date,
        ...data,
      }));
    },
    enabled: !!date?.from && !!date?.to,
  });

  // Calculate summary statistics
  const totalTransactions = transactionsData?.reduce((sum, day) => sum + day.transactions, 0) ?? 0;
  const totalAmount = transactionsData?.reduce((sum, day) => sum + day.total_amount, 0) ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.full_name}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingProducts ? "Loading..." : productsData?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : `Rp ${totalAmount?.toLocaleString() || 0}`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : totalTransactions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rider</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Grafik Transaksi</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={transactionsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'total_amount') {
                        return [`Rp ${value.toLocaleString()}`, 'Total Penjualan'];
                      }
                      return [value, 'Jumlah Transaksi'];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="transactions"
                    name="Jumlah Transaksi"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_amount"
                    name="Total Penjualan"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
