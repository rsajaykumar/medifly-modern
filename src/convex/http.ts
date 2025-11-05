import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// PhonePe webhook endpoint
http.route({
  path: "/api/phonepe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      
      // Extract transaction details from webhook
      const base64Response = body.response;
      const decodedResponse = JSON.parse(
        Buffer.from(base64Response, "base64").toString("utf-8")
      );

      if (decodedResponse.success && decodedResponse.data?.state === "COMPLETED") {
        // Extract orderId from merchantTransactionId
        const merchantTxnId = decodedResponse.data.merchantTransactionId;
        const orderIdMatch = merchantTxnId.match(/TXN_(.+?)_/);
        
        if (orderIdMatch && orderIdMatch[1]) {
          const orderId = orderIdMatch[1] as any;
          
          // Update order status
          await ctx.runMutation(internal.orders.updatePaymentDetails, {
            orderId,
            paymentId: merchantTxnId,
            paymentStatus: "completed",
          });
          await ctx.runMutation(internal.orders.updateStatus, {
            orderId,
            status: "confirmed",
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("PhonePe webhook error:", error);
      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;