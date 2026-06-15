/** ── Catalog ──────────────────────────────────────────────────────── */

export interface ProductImage {
  src: string;
  thumb: string;
  blur: string; // base64 data-URI placeholder
  width: number;
  height: number;
  dominant: string; // dominant hex colour of the photo
}

export interface ProductSize {
  label: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string; // category slug
  subcategory?: string;
  price: number; // INR
  compareAtPrice?: number;
  premium: boolean;
  images: ProductImage[];
  description: string;
  materials: string[];
  sizes: ProductSize[];
  occasions: string[];
  customizable: boolean;
  inStock: boolean;
  curated: boolean;
  featured?: boolean;
  hidden?: boolean; // admin can hide products
  sourcePath?: string;
}

export interface Subcategory {
  slug: string;
  name: string;
  count: number;
}

export interface Category {
  slug: string;
  name: string;
  blurb: string;
  count: number;
  subcategories: Subcategory[];
}

/** ── Cart / wishlist ──────────────────────────────────────────────── */

export interface CartItem {
  slug: string;
  name: string;
  sku: string;
  image: string; // thumb src
  unitPrice: number; // base + size delta, BEFORE bulk discount
  size: string;
  qty: number;
  engraving?: string;
  logoNote?: string; // e.g. "logo to be shared on WhatsApp"
  category: string;
}

/** ── Orders ───────────────────────────────────────────────────────── */

export type PaymentMethod = "razorpay" | "cod" | "whatsapp";
export type PaymentStatus = "pending" | "paid" | "cod" | "failed";
export type OrderStatus =
  | "new"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus | "payment";
  label: string;
  at: string; // ISO timestamp
}

export interface Order {
  id: string; // e.g. TG-7F3K2A
  items: CartItem[];
  customer: OrderCustomer;
  subtotal: number;
  bulkDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: string;
}

/** ── Customization requests ───────────────────────────────────────── */

export interface CustomRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  productType: string;
  quantity: number;
  message: string;
  logoFilename?: string;
  createdAt: string;
  status: "new" | "quoted" | "closed";
}
