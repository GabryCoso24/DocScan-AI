export interface LineItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ExtractedData {
  document_type: "receipt" | "invoice" | "contract" | "id_document" | "other";
  vendor_name: string | null;
  vendor_address: string | null;
  vendor_vat: string | null;
  date: string | null;
  time: string | null;
  total_amount: number | null;
  currency: string;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  payment_method: string | null;
  invoice_number: string | null;
  line_items: LineItem[];
  notes: string | null;
  confidence: number;
  language: string;
  raw_text_summary: string;
}

export interface ExtractionResult {
  id: string;
  timestamp: string;
  filename: string;
  file_size: number;
  image_url: string;
  model: string;
  processing_time_ms: number;
  status: "success" | "error" | "processing";
  data: ExtractedData | null;
  error: string | null;
}
