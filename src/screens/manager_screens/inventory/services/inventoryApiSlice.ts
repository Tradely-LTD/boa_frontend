import { emptyApi } from '../../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../../types/pagination';

export interface InventoryOverviewRow {
  centreId: number;
  centreName: string;
  commodity: string;
  totalTradeKg: number;
  totalStorageKg: number;
  totalReceivedKg: number;
  totalSoldKg: number;
  availableKg: number;  // trade stock minus sold — what can actually be sold
  intakeCount: number;
}

export interface IntakeWithStock {
  id: number;
  refId: string;
  centreId: number;
  centreName: string;
  commodity: string;
  quantityKg: number;
  farmerName: string | null;
  farmerPhone: string | null;
  gradeQuality: string | null;
  createdAt: string;
  soldKg: number;
  availableKg: number;
}

export interface InventorySale {
  id: number;
  refId: string;
  centreId: number;
  centreName: string;
  intakeId: number;
  commodity: string;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  paymentMethod: string;
  receiptNumber: string;
  soldBy: number;
  notes: string | null;
  createdAt: string;
}

export interface CreatePosSaleBody {
  intakeId: number;
  quantityKg: number;
  pricePerKg: number;
  buyerName?: string;
  buyerPhone?: string;
  paymentMethod?: string;
  notes?: string;
}

export const inventoryApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query<{ success: boolean; data: InventoryOverviewRow[] }, void>({
      query: () => ({ url: '/inventory' }),
      providesTags: ['InventorySales' as any],
    }),
    getIntakesWithStock: builder.query<{ success: boolean; data: IntakeWithStock[] }, void>({
      query: () => ({ url: '/inventory/intakes-for-centre' }),
      providesTags: ['Intakes' as any, 'InventorySales' as any],
    }),
    getPosSales: builder.query<PaginatedResponse<InventorySale>, PaginationParams>({
      query: (params) => ({ url: '/inventory/pos-sales', params }),
      providesTags: ['InventorySales' as any],
    }),
    createPosSale: builder.mutation<{ success: boolean; data: InventorySale }, CreatePosSaleBody>({
      query: (body) => ({ url: '/inventory/pos-sales', method: 'POST', body }),
      invalidatesTags: ['InventorySales' as any],
    }),
  }),
  overrideExisting: false,
});

export const { useGetInventoryQuery, useGetIntakesWithStockQuery, useGetPosSalesQuery, useCreatePosSaleMutation } = inventoryApi;
