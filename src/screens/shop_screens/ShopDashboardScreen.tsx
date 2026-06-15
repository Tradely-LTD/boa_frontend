import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetShopQuery, useListShopSalesQuery, useListShopExpensesQuery, useGetShopInventoryQuery } from './services/shopApiSlice';

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().slice(0, 10);

export default function ShopDashboardScreen() {
  const user   = useSelector((s: RootState) => s.auth.user);
  const shopId = (user as any)?.shopId as number | undefined;
  const isOwner = user?.role === 'shop_owner';

  const { data: shopData } = useGetShopQuery(shopId!, { skip: !shopId });
  const { data: salesData }    = useListShopSalesQuery(shopId!, { skip: !shopId });
  const { data: expensesData } = useListShopExpensesQuery(shopId!, { skip: !shopId });
  const { data: inventoryData } = useGetShopInventoryQuery(shopId!, { skip: !shopId });

  const shop     = shopData?.data;
  const allSales = salesData?.data ?? [];
  const expenses = expensesData?.data ?? [];
  const inventory = inventoryData?.data ?? [];

  // For sales rep: only their own sales today
  const mySalesId = user?.userId;
  const todaySales = allSales.filter(s => {
    const saleDate = s.createdAt.slice(0, 10) === today;
    return isOwner ? saleDate : (saleDate && s.soldBy === mySalesId);
  });

  const todayRevenue  = todaySales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0);
  const todayExpenses = expenses
    .filter(e => e.createdAt.slice(0, 10) === today && (!isOwner ? e.loggedBy === mySalesId : true))
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  const totalInventoryKg = inventory.reduce((s, i) => s + parseFloat(i.quantityKg), 0);
  const availableKg      = inventory.reduce((s, i) => s + (i.availableKg ?? parseFloat(i.quantityKg)), 0);

  const allTimeRevenue = isOwner
    ? allSales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0)
    : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          {isOwner ? 'Shop Dashboard' : 'My Sales Dashboard'}
        </h1>
        {shop && (
          <p className="text-slate-500 text-sm mt-0.5">
            {shop.shopName} · {shop.shopRefId}
            {shop.spaceNumber ? ` · Space ${shop.spaceNumber}` : ''}
          </p>
        )}
      </div>

      {/* Today stats */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Sales Today"       value={fmt(todayRevenue)}         icon="payments"       color="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <StatCard label="Transactions"      value={todaySales.length}         icon="receipt_long"   color="bg-blue-50 text-blue-700 border-blue-200" />
          <StatCard label="Expenses Today"    value={fmt(todayExpenses)}        icon="money_off"      color="bg-red-50 text-red-700 border-red-200" />
          <StatCard label="Net Today"         value={fmt(todayRevenue - todayExpenses)} icon="account_balance" color="bg-amber-50 text-amber-700 border-amber-200" />
        </div>
      </div>

      {/* Owner-only: overall stats + inventory */}
      {isOwner && (
        <>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Overview</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Revenue"    value={fmt(allTimeRevenue)}                    icon="trending_up"  color="bg-purple-50 text-purple-700 border-purple-200" />
              <StatCard label="Total Sales"      value={allSales.length}                        icon="shopping_cart" color="bg-slate-50 text-slate-700 border-slate-200" />
              <StatCard label="Inventory (total)" value={`${totalInventoryKg.toLocaleString()} kg`} icon="inventory_2" color="bg-blue-50 text-blue-700 border-blue-200" />
              <StatCard label="Available Stock"  value={`${availableKg.toLocaleString()} kg`}  icon="scale"        color="bg-emerald-50 text-emerald-700 border-emerald-200" />
            </div>
          </div>

          {/* Stock at a glance */}
          {inventory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Stock Overview</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sold</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{item.commodity}</td>
                        <td className="px-5 py-3 text-slate-600">{parseFloat(item.quantityKg).toLocaleString()} kg</td>
                        <td className="px-5 py-3 text-slate-600">{(item.soldKg ?? 0).toLocaleString()} kg</td>
                        <td className="px-5 py-3">
                          <span className={`font-semibold ${(item.availableKg ?? 0) > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                            {(item.availableKg ?? 0).toLocaleString()} kg
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff */}
          {shop?.staff && shop.staff.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Staff</p>
              </div>
              <div className="divide-y divide-slate-50">
                {shop.staff.map(s => (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      s.role === 'shop_owner' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.role === 'shop_owner' ? 'Owner' : 'Sales Rep'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent sales for this user */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            {isOwner ? "Today's Sales" : "My Sales Today"}
          </p>
        </div>
        {todaySales.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-slate-400 text-sm mt-2">No sales recorded today</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todaySales.slice(0, 10).map(sale => (
              <div key={sale.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{sale.commodity}</p>
                  <p className="text-xs text-slate-400">{parseFloat(sale.quantityKg).toLocaleString()} kg · {sale.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-700">{fmt(parseFloat(sale.totalAmount))}</p>
                  <p className="text-xs text-slate-400 font-mono">{sale.receiptNumber}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-xl font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined text-2xl opacity-70 ${text}`}>{icon}</span>
      </div>
    </div>
  );
}
