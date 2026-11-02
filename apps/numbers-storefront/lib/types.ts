export type NumberType = "LOCAL" | "MOBILE" | "TOLL_FREE";
export type Capability = "SMS" | "VOICE";

export interface Money {
  currencyCode?: string;
  amount?: string;
}

export interface AvailableNumberDto {
  phoneNumber?: string;
  regionCode?: string;
  type?: string;
  capability?: string[];
  setupPrice?: Money;
  monthlyPrice?: Money;
  paymentIntervalMonths?: number;
  supportingDocumentationRequired?: boolean;
}

export interface RegionDto {
  regionCode: string;
  regionName: string;
  types: string[];
}

export interface StatusDto {
  configured: boolean;
  missing: string[];
}

export interface RentRequestDto {
  phoneNumber: string;
  smsServicePlanId?: string;
  voiceAppId?: string;
  callbackUrl?: string;
}

export interface ApiError {
  error: string;
  code?: "credentials_required" | "sinch_api_error" | "bad_request";
}
