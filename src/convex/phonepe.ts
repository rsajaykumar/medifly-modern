"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

// PhonePe API Configuration
// NOTE: These are test values for development. Replace with actual PhonePe credentials for production.
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_API_URL = process.env.PHONEPE_ENV === "production" 
  ? "https://api.phonepe.com/apis/hermes"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

// Generate X-VERIFY header for PhonePe API
function generateXVerify(payload: string, endpoint: string): string {
  const checksum = crypto
    .createHash("sha256")
    .update(payload + endpoint + PHONEPE_SALT_KEY)
    .digest("hex");
  return `${checksum}###${PHONEPE_SALT_INDEX}`;
}

export const initiatePayment = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    userId: v.string(),
    userPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const merchantTransactionId = `TXN_${args.orderId}_${Date.now()}`;
      const merchantUserId = `USER_${args.userId}`;

      // PhonePe payment request payload
      const paymentPayload = {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId,
        merchantUserId,
        amount: Math.round(args.amount * 100), // Convert to paise
        redirectUrl: `${process.env.CONVEX_SITE_URL}/payment/callback?orderId=${args.orderId}`,
        redirectMode: "POST",
        callbackUrl: `${process.env.CONVEX_SITE_URL}/api/phonepe/webhook`,
        mobileNumber: args.userPhone || "",
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      // Base64 encode the payload
      const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
      
      // Generate X-VERIFY header
      const xVerify = generateXVerify(base64Payload, "/pg/v1/pay");

      // Make API request to PhonePe
      const response = await fetch(`${PHONEPE_API_URL}/pg/v1/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
        body: JSON.stringify({
          request: base64Payload,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
        // Store transaction details
        await ctx.runMutation(internal.orders.updatePaymentDetails, {
          orderId: args.orderId,
          paymentId: merchantTransactionId,
          paymentStatus: "initiated",
        });

        return {
          success: true,
          paymentUrl: result.data.instrumentResponse.redirectInfo.url,
          transactionId: merchantTransactionId,
        };
      } else {
        throw new Error(result.message || "Payment initiation failed");
      }
    } catch (error: any) {
      console.error("PhonePe payment initiation error:", error);
      return {
        success: false,
        error: error.message || "Failed to initiate payment",
      };
    }
  },
});

export const verifyPayment = action({
  args: {
    merchantTransactionId: v.string(),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    try {
      const endpoint = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${args.merchantTransactionId}`;
      const xVerify = generateXVerify("", endpoint);

      const response = await fetch(`${PHONEPE_API_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
        },
      });

      const result = await response.json();

      if (result.success && result.data?.state === "COMPLETED") {
        // Update order status
        await ctx.runMutation(internal.orders.updatePaymentDetails, {
          orderId: args.orderId,
          paymentId: args.merchantTransactionId,
          paymentStatus: "completed",
        });

        await ctx.runMutation(internal.orders.updateStatus, {
          orderId: args.orderId,
          status: "confirmed",
        });

        return {
          success: true,
          status: "COMPLETED",
          transactionId: result.data.transactionId,
        };
      } else if (result.data?.state === "FAILED") {
        await ctx.runMutation(internal.orders.updatePaymentDetails, {
          orderId: args.orderId,
          paymentId: args.merchantTransactionId,
          paymentStatus: "failed",
        });

        return {
          success: false,
          status: "FAILED",
          message: result.data.responseCode || "Payment failed",
        };
      } else {
        return {
          success: false,
          status: result.data?.state || "PENDING",
          message: "Payment is still pending",
        };
      }
    } catch (error: any) {
      console.error("PhonePe payment verification error:", error);
      return {
        success: false,
        error: error.message || "Failed to verify payment",
      };
    }
  },
});
