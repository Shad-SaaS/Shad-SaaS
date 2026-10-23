import { InternalErrorCode, NormalizedError } from "./types";

/**
 * Standard classification dictionary for internal provider error codes
 */
export interface ErrorClassification {
  internalCode: InternalErrorCode;
  retryable: boolean;
  safeToFailover: boolean;
  shouldRefund: boolean | "unknown";
  defaultMessage: string;
}

export const ERROR_CLASSIFICATIONS: Record<InternalErrorCode, ErrorClassification> = {
  AUTH_FAILED: {
    internalCode: "AUTH_FAILED",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "فشل المصادقة مع المزود أو انتهاء صلاحية المفتاح",
  },
  IP_NOT_ALLOWED: {
    internalCode: "IP_NOT_ALLOWED",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "عنوان IP غير مصرح به لدى المزود الخارجي",
  },
  PROVIDER_MAINTENANCE: {
    internalCode: "PROVIDER_MAINTENANCE",
    retryable: true,
    safeToFailover: true,
    shouldRefund: false,
    defaultMessage: "المزود قيد الصيانة حالياً",
  },
  PROVIDER_INSUFFICIENT_BALANCE: {
    internalCode: "PROVIDER_INSUFFICIENT_BALANCE",
    retryable: false,
    safeToFailover: true,
    shouldRefund: false, // If failover is possible, don't refund immediately, switch provider
    defaultMessage: "رصيد المتجر غير كافٍ لدى المزود الخارجي",
  },
  QTY_NOT_AVAILABLE: {
    internalCode: "QTY_NOT_AVAILABLE",
    retryable: false,
    safeToFailover: true,
    shouldRefund: true,
    defaultMessage: "الكمية المطلوبة غير متوفرة في مخزون المزود",
  },
  QTY_NOT_ALLOWED: {
    internalCode: "QTY_NOT_ALLOWED",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "الكمية المحددة غير مسموح بها لهذا المنتج",
  },
  QTY_TOO_SMALL: {
    internalCode: "QTY_TOO_SMALL",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "الكمية المطلوبة أقل من الحد الأدنى المسموح به",
  },
  QTY_TOO_LARGE: {
    internalCode: "QTY_TOO_LARGE",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "الكمية المطلوبة تتجاوز الحد الأقصى المسموح به",
  },
  PLAYER_BLOCKED: {
    internalCode: "PLAYER_BLOCKED",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "معرف الحساب أو اللاعب محظور لدى المزود",
  },
  TWO_FA_REQUIRED: {
    internalCode: "TWO_FA_REQUIRED",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "الطلب يتطلب تحقق ثنائي (2FA) غير مفعل لدى المزود",
  },
  PRODUCT_NOT_FOUND: {
    internalCode: "PRODUCT_NOT_FOUND",
    retryable: false,
    safeToFailover: true,
    shouldRefund: true,
    defaultMessage: "المنتج غير موجود أو تم حذفه لدى المزود",
  },
  PRODUCT_UNAVAILABLE: {
    internalCode: "PRODUCT_UNAVAILABLE",
    retryable: true,
    safeToFailover: true,
    shouldRefund: false,
    defaultMessage: "المنتج غير متاح حالياً لدى المزود",
  },
  RETRY_LATER: {
    internalCode: "RETRY_LATER",
    retryable: true,
    safeToFailover: false,
    shouldRefund: false,
    defaultMessage: "يرجى الانتظار وإعادة المحاولة بعد دقيقة",
  },
  RATE_LIMITED: {
    internalCode: "RATE_LIMITED",
    retryable: true,
    safeToFailover: false,
    shouldRefund: false,
    defaultMessage: "تم تجاوز حد الطلبات المسموح به (Rate Limit)",
  },
  VALIDATION_ERROR: {
    internalCode: "VALIDATION_ERROR",
    retryable: false,
    safeToFailover: false,
    shouldRefund: true,
    defaultMessage: "بيانات الطلب غير صالحة أو ينقصها حقول مطلوبة",
  },
  TIMEOUT: {
    internalCode: "TIMEOUT",
    retryable: true,
    safeToFailover: false, // Never failover on timeout until verified!
    shouldRefund: "unknown", // Unknown result, needs verification before refund!
    defaultMessage: "انتهت مهلة الاتصال بالمزود الخارجي دون رد مؤكد",
  },
  UNKNOWN: {
    internalCode: "UNKNOWN",
    retryable: false,
    safeToFailover: false,
    shouldRefund: "unknown",
    defaultMessage: "حدث خطأ غير معروف لدى المزود الخارجي",
  },
};

/**
 * Creates a normalized error object from an internal code and optional custom message/raw code
 */
export function createNormalizedError(
  internalCode: InternalErrorCode,
  options?: {
    providerCode?: string | number;
    message?: string;
    overrideSafeToFailover?: boolean;
    overrideShouldRefund?: boolean | "unknown";
  }
): NormalizedError {
  const meta = ERROR_CLASSIFICATIONS[internalCode] || ERROR_CLASSIFICATIONS.UNKNOWN;
  return {
    internalCode,
    providerCode: options?.providerCode,
    message: options?.message || meta.defaultMessage,
    retryable: meta.retryable,
    safeToFailover: options?.overrideSafeToFailover !== undefined ? options?.overrideSafeToFailover : meta.safeToFailover,
    shouldRefund: options?.overrideShouldRefund !== undefined ? options?.overrideShouldRefund : meta.shouldRefund,
  };
}
