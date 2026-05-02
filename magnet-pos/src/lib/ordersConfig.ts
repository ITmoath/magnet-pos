/** مصادر طلبات تطبيق العميل (Customer App) — تُستخدم مع جدول orders */
export const CUSTOMER_APP_ORDER_SOURCES = ['customer_app', 'mobile_app'] as const

export type CustomerAppOrderSource = (typeof CUSTOMER_APP_ORDER_SOURCES)[number]

export function isCustomerAppOrderSource(source: string): source is CustomerAppOrderSource {
  return (CUSTOMER_APP_ORDER_SOURCES as readonly string[]).includes(source)
}

/** إن وُجد يُطبَّق على عمود restaurant_id (مطعم Burger House) */
export function getPosRestaurantId(): string | null {
  const v = process.env.NEXT_PUBLIC_POS_RESTAURANT_ID
  return v != null && String(v).trim().length > 0 ? String(v).trim() : null
}

export const TERMINAL_ONLINE_ORDER_STATUSES = ['completed', 'rejected'] as const
