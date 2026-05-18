import { emptyApi } from '../../../../store/emptyApi';

export interface DeliveryZone {
  state:  string;
  lga?:   string;
  charge: number;
}

export interface PackagingInfo {
  packageType:     string;
  packageWeightKg: number;
  labelType:       string;
  moqKg:           number;
  notes?:          string;
}

export interface MarketplaceListing {
  id:                  number;
  refId:               string;
  centreId:            number;
  centreName:          string;
  centreState:         string;
  centreLga:           string | null;
  commodity:           string;
  gradeQuality:        string | null;
  description:         string | null;
  quantityAvailableKg: number;
  pricePerKg:          number;
  images:              string[];
  status:              'active' | 'paused' | 'sold_out' | 'expired';
  isReceiptBacked:     boolean;
  postedBy:            number;
  expiresAt:           string | null;
  deliveryAvailable:   boolean;
  deliveryZones:       DeliveryZone[];
  specs:               Record<string, string>;
  packaging:           PackagingInfo;
  bankName:            string | null;
  bankAccountNumber:   string | null;
  bankAccountName:     string | null;
  createdAt:           string;
  updatedAt:           string;
}

export interface MarketplaceOrder {
  id:             number;
  refId:          string;
  listingId:      number;
  buyerId:        number;
  centreId:       number;
  centreName:     string;
  commodity:      string;
  quantityKg:     number;
  pricePerKg:     number;
  totalAmount:    number;
  buyerName:      string;
  buyerEmail:     string;
  buyerPhone:     string;
  status:         'pending_payment' | 'paid' | 'processing' | 'completed' | 'cancelled';
  isManual:       boolean;
  notes:          string | null;
  deliveryType:    'pickup' | 'delivery';
  deliveryState:   string | null;
  deliveryLga:     string | null;
  deliveryCharge:  number;
  paymentGateway:  string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface CreateListingPayload {
  commodity:           string;
  gradeQuality?:       string;
  description?:        string;
  quantityAvailableKg: number;
  pricePerKg:          number;
  images?:             string[];
  centreState:         string;
  centreLga?:          string;
  isReceiptBacked?:    boolean;
  expiresAt?:          string;
  deliveryAvailable?:  boolean;
  deliveryZones?:      DeliveryZone[];
  specs?:              Record<string, string>;
  packaging?:          PackagingInfo;
  bankName?:           string;
  bankAccountNumber?:  string;
  bankAccountName?:    string;
}

export interface ManualSalePayload {
  listingId:  number;
  quantityKg: number;
  buyerName?: string;
  buyerPhone?: string;
  notes?:     string;
}

const marketplaceApi = emptyApi.injectEndpoints({
  endpoints: (build) => ({
    getMyListings: build.query<MarketplaceListing[], void>({
      query: () => '/marketplace/listings/mine/all',
      transformResponse: (r: any) => r.data,
      providesTags: ['Marketplace'],
    }),
    createListing: build.mutation<MarketplaceListing, CreateListingPayload>({
      query: (body) => ({ url: '/marketplace/listings', method: 'POST', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Marketplace'],
    }),
    updateListing: build.mutation<MarketplaceListing, { id: number } & Partial<CreateListingPayload & { status: string }>>({
      query: ({ id, ...body }) => ({ url: `/marketplace/listings/${id}`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Marketplace'],
    }),
    deleteListing: build.mutation<void, number>({
      query: (id) => ({ url: `/marketplace/listings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Marketplace'],
    }),
    recordManualSale: build.mutation<void, ManualSalePayload>({
      query: ({ listingId, ...body }) => ({ url: `/marketplace/listings/${listingId}/manual-sale`, method: 'POST', body }),
      invalidatesTags: ['Marketplace'],
    }),
    getPresignedUrl: build.mutation<{ uploadUrl: string; objectUrl: string; key: string }, { fileExtension: string }>({
      query: (body) => ({ url: '/marketplace/uploads/presigned-url', method: 'POST', body }),
      transformResponse: (r: any) => r.data,
    }),
    getCentreOrders: build.query<MarketplaceOrder[], void>({
      query: () => '/marketplace/orders/centre',
      transformResponse: (r: any) => r.data,
      providesTags: ['MarketplaceOrders'],
    }),
    getManualSales: build.query<MarketplaceOrder[], void>({
      query: () => '/marketplace/orders/centre?manual=true',
      transformResponse: (r: any) => r.data,
      providesTags: ['MarketplaceOrders'],
    }),
    updateOrderStatus: build.mutation<MarketplaceOrder, { id: number; status: 'processing' | 'completed' | 'cancelled' }>({
      query: ({ id, ...body }) => ({ url: `/marketplace/orders/${id}/status`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MarketplaceOrders'],
    }),
    confirmPosPayment: build.mutation<MarketplaceOrder, { id: number; stan: string; rrn: string }>({
      query: ({ id, ...body }) => ({ url: `/marketplace/orders/${id}/confirm-pos`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MarketplaceOrders'],
    }),
    confirmBankTransfer: build.mutation<MarketplaceOrder, number>({
      query: (id) => ({ url: `/marketplace/orders/${id}/confirm-bank`, method: 'PATCH' }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MarketplaceOrders'],
    }),
  }),
});

export const {
  useGetMyListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useRecordManualSaleMutation,
  useGetPresignedUrlMutation,
  useGetCentreOrdersQuery,
  useUpdateOrderStatusMutation,
  useConfirmPosPaymentMutation,
  useConfirmBankTransferMutation,
  useGetManualSalesQuery,
} = marketplaceApi;
