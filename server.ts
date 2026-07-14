import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Load Firebase Config dynamically so server is always in sync with real app database
  let projectId = "speedy-web-hn50x";
  let databaseId = "ai-studio-bharatkakaam-898ca355-17bf-438e-8472-c619d216d878";
  let firebaseApiKey = "";
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (configData.projectId) projectId = configData.projectId;
      if (configData.firestoreDatabaseId) databaseId = configData.firestoreDatabaseId;
      if (configData.apiKey) firebaseApiKey = configData.apiKey;
    }
  } catch (err) {
    console.error("Error reading firebase-applet-config.json on server:", err);
  }

  app.use(express.json());

  // Global CORS middleware to allow external tools (like PWABuilder) to fetch manifest, icons, and static assets
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // AI Chat endpoint for Help Center
  app.post("/api/help-chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      if (!ai) {
        return res.json({
          text: "আমার এআই সিস্টেমটি বর্তমানে অফলাইনে আছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন বা কিছুক্ষণ পর আবার চেষ্টা করুন। (AI Help System currently offline, please configure GEMINI_API_KEY)"
        });
      }

      // Extract Order IDs (BKK-XXXXXX) or 12-digit UTRs to look up live payment records
      let extractedUtr = "";
      let extractedOrderId = "";

      for (const msg of messages) {
        if (msg.content) {
          const utrMatch = msg.content.match(/\b\d{12}\b/);
          if (utrMatch) {
            extractedUtr = utrMatch[0];
          }
          const orderMatch = msg.content.match(/\bBKK-\d{6}\b/i);
          if (orderMatch) {
            extractedOrderId = orderMatch[0].toUpperCase();
          }
        }
      }

      let paymentContext = "";

      // Query broker_payments for specific Order ID
      if (extractedOrderId) {
        try {
          const paymentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/broker_payments/${extractedOrderId}`;
          const resPay = await fetch(paymentUrl);
          if (resPay.status === 200) {
            const doc = await resPay.json();
            const fields = doc.fields;
            const status = fields.status ? fields.status.stringValue : "unknown";
            const utr = fields.utr ? fields.utr.stringValue : "";
            const err = fields.errorMessage ? fields.errorMessage.stringValue : "";
            const errBn = fields.errorMessageBn ? fields.errorMessageBn.stringValue : "";
            const phone = fields.brokerPhone ? fields.brokerPhone.stringValue : "";
            const timestamp = fields.timestamp ? parseInt(fields.timestamp.integerValue, 10) : Date.now();
            const dateStr = new Date(timestamp).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });

            paymentContext += `\n[SYSTEM NOTIFICATION: User is asking about Order ID: ${extractedOrderId}. We found the payment record in Firestore:
- Status: ${status} (সফল / রিজেক্টেড / পেন্ডিং)
- UTR: ${utr}
- Error Reason (English): ${err}
- Error Reason (Bengali): ${errBn}
- Broker Phone: ${phone}
- Date & Time: ${dateStr}
If the status is "success" (সফল), congratulate the user and let them know their subscription is fully active! 
If the status is "rejected" (রিজেক্টেড/ব্যর্থ), explain clearly in Bengali that the payment was rejected due to: "${errBn}". Offer step-by-step guidance on how to fix it.]`;
          } else {
            paymentContext += `\n[SYSTEM NOTIFICATION: User is asking about Order ID: ${extractedOrderId} but it was not found in our database yet. Please request that they double-check the Order ID or make sure they entered it correctly.]`;
          }
        } catch (e) {
          console.error("Error fetching order context in help-chat:", e);
        }
      }

      // Query UTR if no Order ID but UTR is found
      if (extractedUtr && !extractedOrderId) {
        try {
          const usedUtrUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/used_utrs/${extractedUtr}`;
          const usedRes = await fetch(usedUtrUrl);
          if (usedRes.status === 200) {
            paymentContext += `\n[SYSTEM NOTIFICATION: The UTR ${extractedUtr} is already REGISTERED and VERIFIED successfully! Their subscription has been activated. They do not need to do anything else. If their account still shows inactive, ask them to close the dashboard and re-open it.]`;
          } else {
            const smsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/bank_sms_receipts/${extractedUtr}`;
            const smsRes = await fetch(smsUrl);
            if (smsRes.status === 200) {
              const smsDoc = await smsRes.json();
              const fields = smsDoc.fields;
              const matched = fields.matched ? !!fields.matched.booleanValue : false;
              const matchedPhone = fields.matchedPhone ? fields.matchedPhone.stringValue : "";

              paymentContext += `\n[SYSTEM NOTIFICATION: The UTR ${extractedUtr} is found in our bank credit SMS receipts, but matched is ${matched}.
- If matched is true: It is already used by phone ${matchedPhone}. They cannot use it again!
- If matched is false: We have successfully received their 49 Tk payment, but they haven't linked it to their profile. Tell them to enter this exact UTR on their broker dashboard to immediately activate their account!]`;
            } else {
              paymentContext += `\n[SYSTEM NOTIFICATION: UTR ${extractedUtr} is NOT yet found in our bank records. This means we have not received an SMS from the bank for this credit yet. 
Explain to them that:
1. UTR must be exactly 12 digits (no spaces).
2. Payment of 49 Tk must have gone through successfully.
3. Bank SMS delivery can sometimes be delayed by 1-2 minutes.
4. Ensure that the Merchant's Phone SMS Forwarder app is running and connected.]`;
            }
          }
        } catch (e) {
          console.error("Error fetching UTR context in help-chat:", e);
        }
      }

      // Convert input messages to Gemini structure
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const systemInstruction = `You are the empathetic, friendly, and expert AI Support Agent for Bharat Ka Kaam (भारत का काम / ভারত কা কাম). 
Bharat Ka Kaam is a leading platform connecting job seekers (workers/daily wage earners/garment workers/delivery partners) with employers or brokers in India and Bangladesh.

Your primary purpose is to help users resolve their problems or questions regarding the Bharat Ka Kaam app.
Respond in the language the user speaks. If they write in Bengali, respond in high-quality, friendly Bengali. If they write in English or Hindi, respond in that language.

CRITICAL: Do NOT under any circumstances use any religious greetings, salutations, or religious terms (such as 'Assalamu Alaikum', 'Allah Hafiz', 'Khuda Hafiz', etc.). Keep greetings strictly neutral (e.g., 'Hello', 'Namaskar', 'Welcome', 'হ্যালো', 'নমস্কার', 'नमस्ते', etc.) and professional.

Key Bharat Ka Kaam facts to help you answer questions:
1. Registration & Login: Users register/login with their phone number. If they forget their password, they can click "Forgot Password", enter their registered phone number, and a security OTP will be displayed in a green box on screen for them to auto-fill or enter to reset/login. This makes password recovery automatic and secure without SMS delays.
2. User Roles:
   - Job Seeker (চাকরি প্রার্থী / কর্মী): Can create a profile, list skills, view jobs, and apply/call employers directly.
   - Employer (কাজের মালিক / নিয়োগকর্তা): Can post job listings, specify pay rate, location, and contact applicants.
   - Broker (দালাল / এজেন্সি / ব্রোকার): Can manage multiple worker profiles or post multi-worker job requirements.
3. Trust & Safety: It is a direct contact platform. There are no middleman fees. Users should verify credentials of employers or workers before payment.
4. Core Features: Dynamic filtering by Country, State, District, Job Categories (Daily Wage, Delivery, Garments, Office, Construction, etc.), Profile pictures, and saved/bookmarked listings.
5. If the user reports any other technical problem (e.g. app slowing down, pages not loading): reassure them that we have optimized memory and rendering speeds, but they can reload the app or contact support.

${paymentContext}

Be extremely supportive, friendly, and brief in your responses (try to keep responses under 3-4 sentences so it fits nicely in a chat bubble). Directly address and resolve their issues with step-by-step guidance. Do not use complex technical terms.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini support error:", error);
      return res.status(500).json({ error: "Failed to generate AI response" });
    }
  });
  
  // Explicit route to serve the APK file with correct headers for download
  app.get("/bharat_ka_kaam.apk", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "bharat_ka_kaam.apk");
    if (fs.existsSync(path.join(process.cwd(), "dist", "bharat_ka_kaam.apk"))) {
      filePath = path.join(process.cwd(), "dist", "bharat_ka_kaam.apk");
    } else if (fs.existsSync(path.join(process.cwd(), "bharat_ka_kaam.apk"))) {
      filePath = path.join(process.cwd(), "bharat_ka_kaam.apk");
    }
    
    console.log("Serving APK file from path:", filePath);
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="Bharat_ka_Kaam.apk"');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving APK file:", err);
        if (!res.headersSent) {
          res.status(404).send("APK file not found on server.");
        }
      }
    });
  });
  
  // POST endpoint to write custom assetlinks.json
  app.post("/api/setup-assetlinks", (req, res) => {
    try {
      const { package_name, sha256_fingerprint } = req.body;
      if (!package_name || !sha256_fingerprint) {
        return res.status(400).json({ error: "package_name and sha256_fingerprint are required" });
      }

      const assetLinks = [
        {
          "relation": [
            "delegate_permission/common.handle_all_urls"
          ],
          "target": {
            "namespace": "android_app",
            "package_name": package_name.trim(),
            "sha256_cert_fingerprints": [sha256_fingerprint.trim().toUpperCase()]
          }
        }
      ];

      const publicDir = path.join(process.cwd(), "public", ".well-known");
      const distDir = path.join(process.cwd(), "dist", ".well-known");

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const assetLinksStr = JSON.stringify(assetLinks, null, 2);
      fs.writeFileSync(path.join(publicDir, "assetlinks.json"), assetLinksStr);
      fs.writeFileSync(path.join(distDir, "assetlinks.json"), assetLinksStr);

      console.log(`Successfully updated assetlinks.json for package: ${package_name}`);
      return res.json({ success: true, message: "assetlinks.json updated successfully!" });
    } catch (err: any) {
      console.error("Error updating assetlinks.json:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Helper to parse Indian bank/UPI credit notification SMS
  function parseSMSForUPI(body: string) {
    if (!body || typeof body !== "string") return null;

    // 1. Look for a 12-digit transaction number (UTR)
    // We match any 12-digit sequence of numbers to be extremely robust against lack of word boundaries
    const utrMatch = body.match(/\d{12}/);
    if (!utrMatch) return null;
    const utr = utrMatch[0];

    // Convert to lowercase for matching
    const text = body.toLowerCase();

    // 2. Look for credit keywords and indicators
    const isCredit = /credit|credited|received|deposit|deposited|crediting|credited with|credited by|payment of|credited to|credited of|credited into|জমা|প্রাপ্তি|পেয়েছেন|সফল|transferred to|received in|added to/i.test(text);

    // 3. Look for debit keywords to avoid fraud
    const isDebit = /debited|spent|withdrawn|remitted/i.test(text);

    // If it's explicitly identified as a debit and doesn't contain credit indicators, reject it
    if (isDebit && !isCredit) {
      return null;
    }

    // 4. Search for the payment amount. We look for 49, 49.00 or Bengali "৪৯" anywhere
    const has49 = /49|৪৯/.test(text);
    if (!has49) {
      return null;
    }

    return {
      utr,
      amount: 49,
      rawBody: body
    };
  }

  // Helper to log incoming raw SMS for Admin troubleshooting
  async function logIncomingRawSMS(
    projectId: string,
    databaseId: string,
    rawBody: string,
    parsedUtr: string | null,
    parsedAmount: number | null,
    status: "success" | "ignored" | "unauthorized" | "error",
    reason: string
  ) {
    try {
      const logId = "SMS-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/raw_sms_logs/${logId}${queryParam}`;
      const payload = {
        fields: {
          logId: { stringValue: logId },
          rawBody: { stringValue: rawBody || "" },
          parsedUtr: { stringValue: parsedUtr || "none" },
          parsedAmount: { integerValue: String(parsedAmount || 0) },
          status: { stringValue: status },
          reason: { stringValue: reason },
          timestamp: { stringValue: new Date().toISOString() }
        }
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error("Failed to write raw SMS log to Firestore:", await res.text());
      }
    } catch (err) {
      console.error("Error in logIncomingRawSMS:", err);
    }
  }

  // Secure SMS Webhook Endpoint for merchant's phone SMS forwarder
  app.post("/api/webhook/bank-sms", express.json(), async (req, res) => {
    const bodyText = req.body.text || req.body.message || req.body.body || req.body.msg || "";

    try {
      const incomingSecret = req.query.secret || req.body.secret || req.body.token || req.headers["x-webhook-secret"];
      const configuredSecret = process.env.SMS_WEBHOOK_SECRET || "bharat_ka_kaam_secret_2026";

      if (incomingSecret !== configuredSecret) {
        if (bodyText) {
          await logIncomingRawSMS(projectId, databaseId, bodyText, null, null, "unauthorized", "Invalid secret/token provided in webhook call");
        }
        return res.status(401).json({
          success: false,
          error: "Unauthorized webhook access. Invalid secret."
        });
      }

      if (!bodyText || typeof bodyText !== "string") {
        return res.status(400).json({
          success: false,
          error: "Missing SMS message content in request body."
        });
      }

      console.log(`[Webhook] Received SMS: "${bodyText}"`);
      const parsed = parseSMSForUPI(bodyText);

      if (!parsed) {
        const utrMatch = bodyText.match(/\d{12}/);
        const parsedUtr = utrMatch ? utrMatch[0] : null;
        await logIncomingRawSMS(projectId, databaseId, bodyText, parsedUtr, null, "ignored", "SMS did not match criteria for a 49 INR credit/deposit transaction (missing keywords or amount)");
        return res.json({
          success: false,
          message: "SMS did not match criteria for a 49 INR credit/deposit transaction. Ignored."
        });
      }

      const { utr, amount, rawBody } = parsed;
      const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/bank_sms_receipts/${utr}${queryParam}`;

      const payload = {
        fields: {
          utr: { stringValue: utr },
          amount: { integerValue: String(amount) },
          rawBody: { stringValue: rawBody },
          receivedAt: { stringValue: new Date().toISOString() },
          matched: { booleanValue: false },
          matchedPhone: { stringValue: "" }
        }
      };

      // Save to Firestore (idempotent PUT/PATCH)
      const saveRes = await fetch(firestoreUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        console.error("Failed to write SMS receipt to Firestore:", errText);
        await logIncomingRawSMS(projectId, databaseId, bodyText, utr, amount, "error", `Failed to store in Firestore: ${errText}`);
        return res.status(500).json({
          success: false,
          error: "Failed to store parsed SMS receipt."
        });
      }

      await logIncomingRawSMS(projectId, databaseId, bodyText, utr, amount, "success", "Successfully parsed and stored in bank_sms_receipts collection");
      console.log(`[Webhook] Successfully verified and stored bank payment UTR: ${utr}`);
      return res.json({
        success: true,
        message: "SMS processed, payment UTR credited successfully!",
        utr,
        amount
      });

    } catch (err: any) {
      console.error("Error in bank-sms webhook:", err);
      if (bodyText) {
        await logIncomingRawSMS(projectId, databaseId, bodyText, null, null, "error", `Exception: ${err.message}`);
      }
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error"
      });
    }
  });

  // Endpoint to fetch raw SMS logs for Admin troubleshooting
  app.get("/api/admin/raw-sms-logs", async (req, res) => {
    try {
      const queryParam = firebaseApiKey ? `&key=${firebaseApiKey}` : "";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/raw_sms_logs?pageSize=30${queryParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      const logs = (data.documents || []).map((doc: any) => {
        const fields = doc.fields || {};
        return {
          logId: fields.logId?.stringValue || "",
          rawBody: fields.rawBody?.stringValue || "",
          parsedUtr: fields.parsedUtr?.stringValue || "none",
          parsedAmount: parseInt(fields.parsedAmount?.integerValue || "0", 10),
          status: fields.status?.stringValue || "",
          reason: fields.reason?.stringValue || "",
          timestamp: fields.timestamp?.stringValue || ""
        };
      });
      
      logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.json({ success: true, logs });
    } catch (err: any) {
      console.error("Error fetching raw SMS logs:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint to fetch broker payment attempts for Admin troubleshooting
  app.get("/api/admin/payment-attempts", async (req, res) => {
    try {
      const queryParam = firebaseApiKey ? `&key=${firebaseApiKey}` : "";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/broker_payments?pageSize=30${queryParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      const attempts = (data.documents || []).map((doc: any) => {
        const fields = doc.fields || {};
        return {
          orderId: fields.orderId?.stringValue || "",
          brokerId: fields.brokerId?.stringValue || "",
          brokerPhone: fields.brokerPhone?.stringValue || "",
          brokerName: fields.brokerName?.stringValue || "",
          utr: fields.utr?.stringValue || "",
          amount: parseInt(fields.amount?.integerValue || "0", 10),
          status: fields.status?.stringValue || "",
          errorMessage: fields.errorMessage?.stringValue || "",
          errorMessageBn: fields.errorMessageBn?.stringValue || "",
          timestamp: parseInt(fields.timestamp?.integerValue || "0", 10),
          paymentMethod: fields.paymentMethod?.stringValue || ""
        };
      });
      
      attempts.sort((a: any, b: any) => b.timestamp - a.timestamp);
      return res.json({ success: true, attempts });
    } catch (err: any) {
      console.error("Error fetching payment attempts:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Helper to log broker payment attempts to Firestore
  async function logBrokerPaymentAttempt(
    projectId: string,
    databaseId: string,
    orderId: string,
    brokerId: string,
    phone: string,
    name: string,
    utr: string,
    status: "success" | "rejected" | "pending",
    errorMsg: string = "",
    errorMsgBn: string = "",
    paymentMethod: string = "phonepe"
  ) {
    try {
      const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
      const paymentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/broker_payments/${orderId}${queryParam}`;
      const payload = {
        fields: {
          orderId: { stringValue: orderId },
          brokerId: { stringValue: brokerId || "unknown" },
          brokerPhone: { stringValue: phone || "unknown" },
          brokerName: { stringValue: name || "unknown" },
          utr: { stringValue: utr },
          amount: { integerValue: "49" },
          status: { stringValue: status },
          errorMessage: { stringValue: errorMsg },
          errorMessageBn: { stringValue: errorMsgBn },
          timestamp: { integerValue: String(Date.now()) },
          paymentMethod: { stringValue: paymentMethod || "phonepe" }
        }
      };

      const res = await fetch(paymentUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error("Failed to write broker payment log to Firestore:", await res.text());
      } else {
        console.log(`Recorded payment attempt [${status}] for UTR ${utr} with Order ID ${orderId}`);
      }
    } catch (err) {
      console.error("Error in logBrokerPaymentAttempt:", err);
    }
  }

  // Secure UTR Verification Endpoint to prevent fraud (Manual Admin-approved model)
  app.post("/api/verify-utr", async (req, res) => {
    try {
      const { utr, amount, phone, brokerId, brokerName, paymentMethod, orderId: clientOrderId, isTimeout } = req.body;
      const bId = brokerId || "unknown";
      const bName = brokerName || "unknown";
      const pMethod = paymentMethod || "phonepe";
      const orderId = clientOrderId || ("BKK-" + Math.floor(100000 + Math.random() * 900000).toString());

      if (!utr || typeof utr !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid UTR",
          errorBn: "অনুগ্রহ করে সঠিক UTR নম্বর দিন।"
        });
      }

      const cleanUTR = utr.replace(/\s+/g, "");

      // 1. Structural check: UPI UTR must be exactly 12 digits
      if (cleanUTR.length !== 12 || !/^\d+$/.test(cleanUTR)) {
        return res.status(400).json({
          success: false,
          error: "UTR must be exactly 12 digits",
          errorBn: "UTR নম্বরটি অবশ্যই ১২ ডিজিটের হতে হবে।"
        });
      }

      // If client triggered a timeout
      if (isTimeout) {
        await logBrokerPaymentAttempt(projectId, databaseId, orderId, bId, phone, bName, cleanUTR, "rejected", "Transaction timed out", "পেমেন্টটি যাচাই করতে সময় শেষ হয়েছে। দয়া করে এডমিনের অনুমোদনের জন্য অপেক্ষা করুন বা পুনরায় চেষ্টা করুন।", pMethod);
        return res.json({
          success: false,
          status: "timeout",
          orderId
        });
      }

      const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
      
      // 2. Fetch existing broker_payment document to check status
      const paymentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/broker_payments/${orderId}${queryParam}`;
      const getRes = await fetch(paymentUrl);
      
      if (getRes.status === 200) {
        // Document exists, check status
        const docData = await getRes.json();
        const fields = docData.fields || {};
        const status = fields.status?.stringValue || "pending";
        
        if (status === "success") {
          return res.json({
            success: true,
            message: "Verified and approved by admin!",
            orderId
          });
        } else if (status === "rejected") {
          const errMsg = fields.errorMessage?.stringValue || "Rejected by Admin";
          const errMsgBn = fields.errorMessageBn?.stringValue || "আপনার পেমেন্টটি এডমিন দ্বারা বাতিল করা হয়েছে। দয়া করে সঠিক UTR দিয়ে পুনরায় চেষ্টা করুন।";
          return res.json({
            success: false,
            status: "rejected",
            error: errMsg,
            errorBn: errMsgBn,
            orderId
          });
        } else {
          // Status is still pending
          return res.json({
            success: false,
            status: "pending",
            orderId
          });
        }
      }

      // 3. Brand-new verification request!
      // First check if this UTR has already been successfully verified (double-spend check)
      const usedUtrUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/used_utrs/${cleanUTR}${queryParam}`;
      const usedUtrRes = await fetch(usedUtrUrl);
      if (usedUtrRes.status === 200) {
        await logBrokerPaymentAttempt(projectId, databaseId, orderId, bId, phone, bName, cleanUTR, "rejected", "UTR has already been used by another transaction", "এই UTR নম্বরটি ইতিমধ্যেই অন্য প্রোফাইলে ব্যবহার করা হয়েছে। দয়া করে নতুন ও সঠিক UTR নম্বর দিন।", pMethod);
        return res.status(400).json({
          success: false,
          error: "UTR has already been used by another transaction",
          errorBn: "এই UTR নম্বরটি ইতিমধ্যেই অন্য প্রোফাইলে ব্যবহার করা হয়েছে। দয়া করে নতুন ও সঠিক UTR নম্বর দিন।"
        });
      }

      // Log it as a pending request
      await logBrokerPaymentAttempt(
        projectId, 
        databaseId, 
        orderId, 
        bId, 
        phone, 
        bName, 
        cleanUTR, 
        "pending", 
        "Waiting for Admin Manual Verification", 
        "আপনার UTR নম্বরটি সফলভাবে জমা দেওয়া হয়েছে। এডমিন ম্যানুয়ালি যাচাই করার পর আপনার একাউন্টটি অ্যাক্টিভ হয়ে যাবে। অনুগ্রহ করে অপেক্ষা করুন...", 
        pMethod
      );

      return res.json({
        success: false,
        status: "pending",
        orderId
      });

    } catch (err: any) {
      console.error("Error verifying UTR:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error",
        errorBn: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।"
      });
    }
  });

  // Admin approval/rejection endpoint for manual payments system
  app.post("/api/admin/approve-payment", async (req, res) => {
    try {
      const { orderId, status, reason, reasonBn } = req.body; // status is 'success' or 'rejected'
      if (!orderId || !status || (status !== "success" && status !== "rejected")) {
        return res.status(400).json({ success: false, error: "Invalid parameters" });
      }

      const queryParam = firebaseApiKey ? `?key=${firebaseApiKey}` : "";
      
      // 1. Fetch current payment document to get details (like UTR and phone)
      const paymentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/broker_payments/${orderId}${queryParam}`;
      const getRes = await fetch(paymentUrl);
      if (!getRes.ok) {
        return res.status(404).json({ success: false, error: "Payment attempt not found" });
      }
      
      const paymentDoc = await getRes.json();
      const fields = paymentDoc.fields || {};
      const utr = fields.utr?.stringValue || "";
      const phone = fields.brokerPhone?.stringValue || "unknown";
      const amount = fields.amount?.integerValue || "49";
      const bId = fields.brokerId?.stringValue || "unknown";
      const bName = fields.brokerName?.stringValue || "unknown";
      const pMethod = fields.paymentMethod?.stringValue || "phonepe";
      const timestamp = fields.timestamp?.integerValue || String(Date.now());

      // 2. If status is 'success', register UTR to used_utrs to prevent double spending
      if (status === "success") {
        if (utr) {
          const usedUtrUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/used_utrs/${utr}${queryParam}`;
          // Check if already in used_utrs
          const usedResCheck = await fetch(usedUtrUrl);
          if (usedResCheck.status === 200) {
            return res.status(400).json({ 
              success: false, 
              error: "This UTR has already been verified and used.",
              errorBn: "এই UTRটি ইতিমধ্যেই ব্যবহৃত হয়েছে।"
            });
          }

          // Register in used_utrs
          const payloadUsed = {
            fields: {
              utr: { stringValue: utr },
              amount: { integerValue: String(amount) },
              phone: { stringValue: String(phone) },
              verifiedAt: { stringValue: new Date().toISOString() }
            }
          };
          const createParam = firebaseApiKey ? `?currentDocument.exists=false&key=${firebaseApiKey}` : "?currentDocument.exists=false";
          const registerRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/used_utrs/${utr}${createParam}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadUsed)
          });
          if (!registerRes.ok && registerRes.status !== 409) {
            console.error("Failed to register UTR as used:", await registerRes.text());
          }
        }
      }

      // 3. Update the broker_payments/${orderId} document with the new status
      const updatedFields = {
        fields: {
          orderId: { stringValue: orderId },
          brokerId: { stringValue: bId },
          brokerPhone: { stringValue: phone },
          brokerName: { stringValue: bName },
          utr: { stringValue: utr },
          amount: { integerValue: String(amount) },
          status: { stringValue: status },
          errorMessage: { stringValue: reason || "" },
          errorMessageBn: { stringValue: reasonBn || "" },
          timestamp: { integerValue: String(timestamp) },
          paymentMethod: { stringValue: pMethod }
        }
      };

      const updateRes = await fetch(paymentUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });

      if (!updateRes.ok) {
        throw new Error(await updateRes.text());
      }

      return res.json({ success: true, message: `Payment ${status} completed successfully.` });
    } catch (err: any) {
      console.error("Error approving/rejecting payment:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Explicit route for manifest.json with perfect application/manifest+json Content-Type
  app.get("/manifest.json", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "manifest.json");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "manifest.json");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.sendFile(filePath);
    } else {
      res.status(404).send("manifest.json not found");
    }
  });

  // Explicit route for .well-known/assetlinks.json with application/json Content-Type
  app.get("/.well-known/assetlinks.json", (req, res) => {
    let filePath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", ".well-known", "assetlinks.json");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.sendFile(filePath);
    } else {
      res.status(404).send("assetlinks.json not found");
    }
  });

  // Explicit route for sw.js with perfect application/javascript Content-Type
  app.get("/sw.js", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "sw.js");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "sw.js");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.sendFile(filePath);
    } else {
      res.status(404).send("sw.js not found");
    }
  });

  // Explicit route for logo.png
  app.get("/logo.png", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "logo.png");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "logo.png");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/png");
      res.sendFile(filePath);
    } else {
      res.status(404).send("logo.png not found");
    }
  });

  // Explicit route for icon-192.png
  app.get("/icon-192.png", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "icon-192.png");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "icon-192.png");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/png");
      res.sendFile(filePath);
    } else {
      res.status(404).send("icon-192.png not found");
    }
  });

  // Explicit route for icon-512.png
  app.get("/icon-512.png", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "icon-512.png");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "icon-512.png");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/png");
      res.sendFile(filePath);
    } else {
      res.status(404).send("icon-512.png not found");
    }
  });

  // Explicit route for screenshot-1.jpg
  app.get("/screenshot-1.jpg", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "screenshot-1.jpg");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "screenshot-1.jpg");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/jpeg");
      res.sendFile(filePath);
    } else {
      res.status(404).send("screenshot-1.jpg not found");
    }
  });

  // Explicit route for screenshot-2.jpg
  app.get("/screenshot-2.jpg", (req, res) => {
    let filePath = path.join(process.cwd(), "public", "screenshot-2.jpg");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "dist", "screenshot-2.jpg");
    }
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "image/jpeg");
      res.sendFile(filePath);
    } else {
      res.status(404).send("screenshot-2.jpg not found");
    }
  });

  // Redirect /admin and /admin-portal to the main app with query params to guarantee they work correctly
  app.get(["/admin", "/admin-portal", "/admin/", "/admin-portal/"], (req, res) => {
    res.redirect("/?admin=true");
  });

  // Vite middleware for development / production fallback
  const distPath = path.join(process.cwd(), 'dist');
  // If a production build is present, serve it directly to ensure lightning-fast responses for scanners like PWABuilder
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));

  if (isProduction) {
    console.log("Serving production build from:", distPath);
    app.use(express.static(distPath, { dotfiles: 'allow' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log("Starting Vite development server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Serve index.html for any other requests (SPA Routing Fallback in Dev)
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
