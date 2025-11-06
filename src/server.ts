import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Twilio from "twilio";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;
if (!accountSid || !authToken || !verifyServiceSid) {
  console.error("Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID in .env");
  process.exit(1);
}

const client = Twilio(accountSid, authToken);

// Create TOTP factor (generate seed & URI)
// Request body: { identity: string, friendlyName?: string }
app.post("/api/create-factor", async (req, res) => {
  try {
    const { identity } = req.body;
    if (!identity || typeof identity !== "string") {
      return res.status(400).json({ error: "identity is required (use your internal user id, 8-64 chars, dash-separated alphanumeric recommended)" });
    }

    // Create a TOTP factor for the entity (identity)
    const factor = await client.verify.v2
      .services(verifyServiceSid)
      .entities(identity)
      .newFactors.create({
        factorType: 'totp',
        friendlyName: 'ACME Account'
      });

    console.log(factor.binding);

    return res.json({
      factorSid: factor.sid,
      entitySid: factor.entitySid || factor.entitySid,
      identity: factor.identity,
      binding: factor.binding, // contains secret and uri
      status: factor.status,
      config: factor.config
    });

  }catch(e: unknown){
    console.error(`There was an error: ${e}`);
    return res.status(500).json({ error: e });
  }
});

// Verify TOTP factor (user supplies the code they get from Google Authenticator)
// Request body: { identity: string, factorSid: string, code: string }
app.post("/api/verify-factor", async (req, res) => {
  try {
    const { identity, factorSid, code } = req.body;
    if (!identity || !factorSid || !code) {
      return res.status(400).json({ error: "identity, factorSid and code are required" });
    }

    // Update factor with the authPayload (this is the verification step)
    const updated = await client.verify.v2
      .services(verifyServiceSid)
      .entities(identity)
      .factors(factorSid)
      .update({ authPayload: code });

    return res.json({
      sid: updated.sid,
      status: updated.status, // should be "verified" on success
      updated
    });
  } catch (e: unknown) {
    console.error("verify-factor error", e);
    return res.status(500).json({ error: e });
  }
});

// Create a challenge to check a code (authenticate)
// Request body: { identity: string, factorSid: string, code: string }
app.post("/api/challenge", async (req, res) => {
  try {
    const { identity, factorSid, code } = req.body;
    if (!identity || !factorSid || !code) {
      return res.status(400).json({ error: "identity, factorSid and code are required" });
    }

    const challenge = await client.verify.v2
      .services(verifyServiceSid)
      .entities(identity)
      .challenges
      .create({
        factorSid,
        authPayload: code
      });

    // challenge.status will be "pending", "approved", or "denied"
    return res.json({ challengeSid: challenge.sid, status: challenge.status, challenge });
  } catch (e: unknown) {
    console.error("challenge error", e);
    return res.status(500).json({ error: e });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`TOTP verify server listening on port ${port}`);
});
