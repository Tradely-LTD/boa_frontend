import { emptyApi } from '../../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../../types/pagination';

export interface WarehouseReceipt {
  id: number;
  receiptNumber: string;
  centreId: number;
  centreName: string;
  intakeId: number | null;
  commodity: string;
  quantityKg: number;
  gradeQuality: string | null;
  farmerName: string;
  farmerPhone: string | null;
  farmerNin: string | null;
  issuedBy: number;
  issuedAt: string;
  expiresAt: string | null;
  status: 'active' | 'pledged' | 'redeemed' | 'expired';
  notes: string | null;
  createdAt: string;
}

export interface CreateReceiptBody {
  intakeId?: number;
  commodity?: string;
  quantityKg?: number;
  gradeQuality?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerNin?: string;
  expiresAt?: string;
  notes?: string;
}

export const receiptsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getReceipts: builder.query<PaginatedResponse<WarehouseReceipt>, PaginationParams>({
      query: (params) => ({ url: '/warehouse-receipts', params }),
      providesTags: ['Receipts' as any],
    }),
    createReceipt: builder.mutation<{ success: boolean; data: WarehouseReceipt }, CreateReceiptBody>({
      query: (body) => ({ url: '/warehouse-receipts', method: 'POST', body }),
      invalidatesTags: ['Receipts' as any],
    }),
    updateReceiptStatus: builder.mutation<{ success: boolean; data: WarehouseReceipt }, { id: number; status: string }>({
      query: ({ id, status }) => ({ url: `/warehouse-receipts/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Receipts' as any],
    }),
  }),
  overrideExisting: false,
});

export const { useGetReceiptsQuery, useCreateReceiptMutation, useUpdateReceiptStatusMutation } = receiptsApi;
