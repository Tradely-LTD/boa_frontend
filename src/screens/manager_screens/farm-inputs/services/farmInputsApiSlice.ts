import { emptyApi } from '../../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../../types/pagination';

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  supplierType: string;
  centreId: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface FarmInput {
  id: number;
  refId: string;
  centreId: number;
  centreName: string;
  supplierId: number | null;
  supplierName: string | null;
  inputType: string;
  inputName: string;
  brand: string | null;
  unit: string;
  quantityReceived: number;
  quantityAvailable: number;
  quantitySold: number;
  purchasePricePerUnit: number | null;
  sellingPricePerUnit: number | null;
  receivedBy: number;
  receivedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface FarmInputSale {
  id: number;
  refId: string;
  centreId: number;
  centreName: string;
  inputId: number;
  inputName: string;
  inputType: string;
  quantitySold: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerNin: string | null;
  paymentMethod: string;
  receiptNumber: string;
  soldBy: number;
  notes: string | null;
  createdAt: string;
}

export const farmInputsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedResponse<Supplier>, PaginationParams>({
      query: (params) => ({ url: '/suppliers', params }),
      providesTags: ['Suppliers' as any],
    }),
    createSupplier: builder.mutation<{ success: boolean; data: Supplier }, Partial<Supplier>>({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }),
      invalidatesTags: ['Suppliers' as any],
    }),
    updateSupplier: builder.mutation<{ success: boolean; data: Supplier }, { id: number; body: Partial<Supplier> }>({
      query: ({ id, body }) => ({ url: `/suppliers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Suppliers' as any],
    }),
    deleteSupplier: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Suppliers' as any],
    }),
    getFarmInputs: builder.query<PaginatedResponse<FarmInput>, PaginationParams & { inputType?: string }>({
      query: (params) => ({ url: '/farm-inputs', params }),
      providesTags: ['FarmInputs' as any],
    }),
    createFarmInput: builder.mutation<{ success: boolean; data: FarmInput }, Partial<FarmInput>>({
      query: (body) => ({ url: '/farm-inputs', method: 'POST', body }),
      invalidatesTags: ['FarmInputs' as any],
    }),
    updateFarmInput: builder.mutation<{ success: boolean; data: FarmInput }, { id: number; body: Partial<FarmInput> }>({
      query: ({ id, body }) => ({ url: `/farm-inputs/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FarmInputs' as any],
    }),
    deleteFarmInput: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/farm-inputs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FarmInputs' as any],
    }),
    getFarmInputSales: builder.query<PaginatedResponse<FarmInputSale>, PaginationParams>({
      query: (params) => ({ url: '/farm-inputs/sales', params }),
      providesTags: ['FarmInputSales' as any],
    }),
    createFarmInputSale: builder.mutation<{ success: boolean; data: FarmInputSale }, Partial<FarmInputSale>>({
      query: (body) => ({ url: '/farm-inputs/sales', method: 'POST', body }),
      invalidatesTags: ['FarmInputs' as any, 'FarmInputSales' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation,
  useGetFarmInputsQuery, useCreateFarmInputMutation, useUpdateFarmInputMutation, useDeleteFarmInputMutation,
  useGetFarmInputSalesQuery, useCreateFarmInputSaleMutation,
} = farmInputsApi;
