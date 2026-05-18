import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';

export interface Centre {
  id: number;
  refId: string;
  applicationId: number | null;
  // Identity
  centreName: string;
  centreType: string;
  regNumber: string | null;
  tinNumber: string | null;
  yearEstablished: number | null;
  // Ownership
  ownerName: string | null;
  ownerPhone: string | null;
  ownerNin: string | null;
  // Infrastructure
  commodities: string | null;
  capacityMt: number | null;
  coldStorageCapacityMt: number | null;
  numBays: number | null;
  floorAreaSqm: number | null;
  warehouseType: string | null;
  facilities: string | null;
  powerSource: string | null;
  waterSource: string | null;
  hasAccessRoad: boolean | null;
  warehouseReceiptCapable: boolean | null;
  // Location
  state: string;
  lga: string | null;
  address: string | null;
  gpsLat: string | null;
  gpsLng: string | null;
  // Manager
  managerName: string | null;
  managerPhone: string | null;
  managerNin: string | null;
  managerEmail: string | null;
  // Banking
  bankName: string | null;
  accountNumber: string | null;
  bvn: string | null;
  // Status
  status: 'active' | 'suspended' | 'decommissioned';
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
}

export const centresApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getCentres: builder.query<PaginatedResponse<Centre>, { status?: string; state?: string; search?: string } & PaginationParams>({
      query: (params) => ({ url: '/aggregation-centres', params }),
      providesTags: ['Centres'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetCentresQuery } = centresApi;
