import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const SIGNNOW_API_BASE = "https://api.signnow.com";
const SIGNNOW_DOCUMENT_ID = "bda51151da5f43a0be50bc68a338efea38387d37";

async function signnowFetch(path: string, options: RequestInit = {}) {
  const token = process.env.SIGNNOW_API_KEY;
  if (!token) throw new Error("SIGNNOW_API_KEY is not configured");

  const res = await fetch(`${SIGNNOW_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`SignNow API error ${res.status} on ${path}:`, body);
    throw new Error(`SignNow API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: validationError.message
        });
      }

      const message = await storage.createContactMessage(result.data);

      return res.status(201).json({
        message: "Message received successfully",
        id: message.id
      });
    } catch (error) {
      console.error("Error creating contact message:", error);
      return res.status(500).json({
        message: "An error occurred while processing your request"
      });
    }
  });

  // SignNow: Create embedded signing invite
  // No user details needed — uses placeholder for embedded signing.
  // Real user info is collected at checkout.
  app.post("/api/signnow/create-invite", async (req, res) => {
    try {
      // Step 1: Copy template document to create a new document
      const copyResponse = await signnowFetch(`/template/${SIGNNOW_DOCUMENT_ID}/copy`, {
        method: "POST",
        body: JSON.stringify({
          document_name: `CROA Disclosure - ${Date.now()}`,
        }),
      });
      const documentId = copyResponse.id;

      // Step 2: Get document details to find the role ID
      const docDetails = await signnowFetch(`/document/${documentId}`);
      const role = docDetails.roles?.[0];
      if (!role) {
        return res.status(500).json({ message: "No signing role found on template" });
      }

      // Step 3: Create embedded invite with placeholder signer
      const inviteResponse = await signnowFetch(
        `/v2/documents/${documentId}/embedded-invites`,
        {
          method: "POST",
          body: JSON.stringify({
            invites: [
              {
                email: "signer@bettercreditpartners.com",
                role: role.name,
                order: 1,
                auth_method: "none",
                force_new_signature: 1,
              },
            ],
          }),
        }
      );

      // Extract invite ID from response
      const inviteId =
        inviteResponse.data?.[0]?.id ||
        inviteResponse.invite_id ||
        inviteResponse.data?.id;

      if (!inviteId) {
        console.error("SignNow invite response:", JSON.stringify(inviteResponse));
        return res.status(500).json({ message: "Failed to create signing invite" });
      }

      // Step 4: Generate signing link for iframe embedding
      const linkResponse = await signnowFetch(
        `/v2/documents/${documentId}/embedded-invites/${inviteId}/link`,
        {
          method: "POST",
          body: JSON.stringify({
            auth_method: "none",
            link_expiration: 45,
          }),
        }
      );

      const signingLink = linkResponse.data?.link || linkResponse.link || linkResponse.signing_link;

      if (!signingLink) {
        console.error("SignNow link response:", JSON.stringify(linkResponse));
        return res.status(500).json({ message: "Failed to generate signing link" });
      }

      return res.status(200).json({
        signingLink,
        documentId,
        inviteId,
      });
    } catch (error) {
      console.error("SignNow create-invite error:", error);
      return res.status(500).json({
        message: "Failed to create signing session. Please try again.",
      });
    }
  });

  // SignNow: Check document signing status
  app.get("/api/signnow/status/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      const docDetails = await signnowFetch(`/document/${documentId}`);

      // Check if document has been signed
      const fieldInvites = docDetails.field_invites || [];
      const allSigned = fieldInvites.length > 0 &&
        fieldInvites.every((invite: any) => invite.status === "fulfilled");

      const isSigned = allSigned || docDetails.status === "signed";

      return res.status(200).json({ completed: isSigned });
    } catch (error) {
      console.error("SignNow status check error:", error);
      return res.status(500).json({
        message: "Failed to check signing status",
        completed: false,
      });
    }
  });

  return httpServer;
}
