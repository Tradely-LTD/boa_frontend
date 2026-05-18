import { emptyApi } from '../../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../../types/pagination';

export interface CommodityIntake {
  id: number;
  refId: string;
  centreId: number;
  centreName: string;
  commodity: string;
  quantityKg: number;
  gradeQuality: string | null;
  sourceType: 'farmer' | 'supplier';
  supplierId: number | null;
  supplierName: string | null;
  farmerName: string | null;
  farmerPhone: string | null;
  farmerNin: string | null;
  sourceState: string | null;
  sourceLga: string | null;
  notes: string | null;
  loggedBy: number;
  createdAt: string;
}

export interface CreateIntakeBody {
  commodity: string;
  quantityKg: number;
  gradeQuality?: string;
  sourceType?: 'farmer' | 'supplier';
  supplierId?: number;
  supplierName?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerNin?: string;
  sourceState?: string;
  sourceLga?: string;
  notes?: string;
}

export const intakeApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getIntakes: builder.query<PaginatedResponse<CommodityIntake>, PaginationParams>({
      query: (params) => ({ url: '/commodity-intake', params }),
      providesTags: ['Intakes' as any],
    }),
    createIntake: builder.mutation<{ success: boolean; data: CommodityIntake }, CreateIntakeBody>({
      query: (body) => ({ url: '/commodity-intake', method: 'POST', body }),
      invalidatesTags: ['Intakes' as any],
    }),
  }),
  overrideExisting: false,
});

export const { useGetIntakesQuery, useCreateIntakeMutation } = intakeApi;
