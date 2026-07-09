import { PaymentRecord } from "./types.ts";

/**
 * Tìm kiếm phiên thanh toán (payment) đang ở trạng thái PENDING theo mã thanh toán (payment_code)
 */
export async function findPendingPaymentByCode(supabase: any, paymentCode: string): Promise<PaymentRecord | null> {
  if (!paymentCode) return null;
  try {
    let cleanCode = paymentCode.toUpperCase().trim();
    // Bóc tách mã LX-XXXXXX nếu đầu vào là chuỗi ghép dài (Ví dụ: DUNG0123456789LX123456 -> LX-123456)
    const lxMatch = cleanCode.match(/L\s*X\s*-?\s*([A-Z0-9]{4,15})/i);
    if (lxMatch && lxMatch[1]) {
      cleanCode = `LX-${lxMatch[1].toUpperCase()}`;
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_code", cleanCode)
      .eq("status", "PENDING")
      .maybeSingle();

    if (error) {
      console.error(`❌ [Payment Service] Lỗi khi truy vấn payment_code (${paymentCode}):`, error.message);
      return null;
    }

    return data as PaymentRecord | null;
  } catch (err) {
    console.error("❌ [Payment Service] Ngoại lệ khi truy vấn payment:", err);
    return null;
  }
}

/**
 * Cập nhật trạng thái phiên thanh toán thành MATCHED và đơn hàng thành paid.
 * Khi payment status đổi sang MATCHED, Supabase Realtime sẽ phát sự kiện về Frontend
 * để trang thanh toán QR tự động đổi sang trạng thái thành công (SUCCESS) và phát nhạc!
 */
export async function markPaymentAsMatched(
  supabase: any,
  paymentId: string,
  orderId: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // 1. Cập nhật bảng payments -> MATCHED, paid_at = now
    const { error: payError } = await supabase
      .from("payments")
      .update({
        status: "MATCHED",
        paid_at: now,
      })
      .eq("id", paymentId);

    if (payError) {
      console.error(`❌ [Payment Service] Lỗi khi cập nhật status MATCHED cho payment ${paymentId}:`, payError.message);
      return false;
    }

    // 2. Cập nhật bảng orders -> paid
    if (orderId) {
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      if (orderError) {
        console.error(`❌ [Payment Service] Lỗi khi cập nhật status paid cho order ${orderId}:`, orderError.message);
        // Không return false vì payment đã được update thành công
      } else {
        console.log(`✅ [Payment Service] Đã cập nhật order ${orderId} sang trạng thái paid!`);
      }
    }

    console.log(`🎉 [Payment Service] Phiên thanh toán ${paymentId} đã xác nhận MATCHED thành công!`);
    return true;
  } catch (err) {
    console.error("❌ [Payment Service] Ngoại lệ khi cập nhật trạng thái thanh toán:", err);
    return false;
  }
}
