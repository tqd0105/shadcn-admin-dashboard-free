import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/nodemailer";
import { generateOrderDeliveredHtml, OrderDeliveredData } from "@/lib/email/templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, ...orderData }: { to: string } & OrderDeliveredData = body;

    if (!to || !orderData.orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (to, orderId)" },
        { status: 400 }
      );
    }

    const html = generateOrderDeliveredHtml(orderData);
    const shortId = orderData.orderId.split("-")[0].toUpperCase();
    const subject = `Đơn hàng #${shortId} đã được giao thành công - LuxeCommerce`;

    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error("❌ [API order-delivered] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
