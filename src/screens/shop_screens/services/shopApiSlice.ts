import { emptyApi } from '../../../store/emptyApi';

export interface Shop {
  id: number;
  shopRefId: string;
  centreId: number;
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  ownerNin: string | null;
  businessType: string | null;
  spaceNumber: string | null;
  status: 'active' | 'suspended';
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  staff?: StaffMember[];
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: 'shop_owner' | 'sales_rep';
  isActive: boolean;
}

export interface ShopIntake {
  id: number;
  refId: string;
  shopId: number;
  centreId: number;
  commodity: string;
  quantityKg: string;
  gradeQuality: string | null;
  sourceType: string;
  notes: string | null;
  loggedBy: number;
  createdAt: string;
  soldKg?: number;
  availableKg?: number;
}

export interface ShopSale {
  id: number;
  refId: string;
  shopId: number;
  centreId: number;
  intakeId: number | null;
  commodity: string;
  quantityKg: string;
  pricePerKg: string;
  totalAmount: string;
  buyerName: string | null;
  buyerPhone: string | null;
  paymentMethod: string;
  receiptNumber: string;
  soldBy: number;
  notes: string | null;
  createdAt: string;
}

export interface ShopExpense {
  id: number;
  refId: string;
  shopId: number;
  centreId: number;
  category: string;
  description: string | null;
  amount: string;
  loggedBy: number;
  createdAt: string;
}

export const shopApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    listShops: builder.query<{ success: boolean; data: Shop[] }, void>({
      query: () => '/shops',
      providesTags: ['Shops' as any],
    }),
    getShop: builder.query<{ success: boolean; data: Shop }, number>({
      query: (id) => `/shops/${id}`,
      providesTags: ['Shops' as any],
    }),
    createShop: builder.mutation<{ success: boolean; data: Shop }, Partial<Shop> & {
      shopName: string; ownerName: string; ownerPhone: string;
      ownerEmail?: string; ownerPassword?: string;
    }>({
      query: (body) => ({ url: '/shops', method: 'POST', body }),
      invalidatesTags: ['Shops' as any],
    }),
    updateShopStatus: builder.mutation<{ success: boolean; data: Shop }, { id: number; status: 'active' | 'suspended' }>({
      query: ({ id, ...body }) => ({ url: `/shops/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Shops' as any],
    }),
    addStaff: builder.mutation<{ success: boolean; data: StaffMember }, { shopId: number; name: string; email: string; password: string }>({
      query: ({ shopId, ...body }) => ({ url: `/shops/${shopId}/staff`, method: 'POST', body }),
      invalidatesTags: ['Shops' as any],
    }),
    getShopInventory: builder.query<{ success: boolean; data: ShopIntake[] }, number>({
      query: (shopId) => `/shops/${shopId}/inventory`,
      providesTags: ['ShopInventory' as any],
    }),
    createShopIntake: builder.mutation<{ success: boolean; data: ShopIntake }, { shopId: number; commodity: string; quantityKg: number; gradeQuality?: string; notes?: string }>({
      query: ({ shopId, ...body }) => ({ url: `/shops/${shopId}/inventory`, method: 'POST', body }),
      invalidatesTags: ['ShopInventory' as any],
    }),
    listShopSales: builder.query<{ success: boolean; data: ShopSale[] }, number>({
      query: (shopId) => `/shops/${shopId}/sales`,
      providesTags: ['ShopSales' as any],
    }),
    createShopSale: builder.mutation<{ success: boolean; data: ShopSale }, {
      shopId: number; commodity: string; quantityKg: number; pricePerKg: number;
      intakeId?: number; buyerName?: string; buyerPhone?: string; paymentMethod?: string; notes?: string;
    }>({
      query: ({ shopId, ...body }) => ({ url: `/shops/${shopId}/sales`, method: 'POST', body }),
      invalidatesTags: ['ShopSales' as any, 'ShopInventory' as any],
    }),
    listShopExpenses: builder.query<{ success: boolean; data: ShopExpense[] }, number>({
      query: (shopId) => `/shops/${shopId}/expenses`,
      providesTags: ['ShopExpenses' as any],
    }),
    createShopExpense: builder.mutation<{ success: boolean; data: ShopExpense }, {
      shopId: number; category: string; amount: number; description?: string;
    }>({
      query: ({ shopId, ...body }) => ({ url: `/shops/${shopId}/expenses`, method: 'POST', body }),
      invalidatesTags: ['ShopExpenses' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListShopsQuery, useGetShopQuery, useCreateShopMutation, useUpdateShopStatusMutation,
  useAddStaffMutation,
  useGetShopInventoryQuery, useCreateShopIntakeMutation,
  useListShopSalesQuery, useCreateShopSaleMutation,
  useListShopExpensesQuery, useCreateShopExpenseMutation,
} = shopApi;
