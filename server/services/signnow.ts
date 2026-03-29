const SIGNNOW_API_BASE = "https://api.signnow.com";

export async function signnowFetch(path: string, options: RequestInit = {}) {
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

export async function createSigningInvite(
  templateId: string,
  documentName: string,
  options?: { isGroupTemplate?: boolean }
) {
  let documentId: string;

  if (options?.isGroupTemplate) {
    // Step 1a: Copy document group template
    const groupCopyResponse = await signnowFetch(`/documentgroup/template/${templateId}/copy`, {
      method: "POST",
      body: JSON.stringify({ group_name: documentName }),
    });
    // Extract the first document from the group
    const documents = groupCopyResponse.documents || groupCopyResponse.document_ids || [];
    const firstDoc = typeof documents[0] === "string" ? documents[0] : documents[0]?.id;
    if (!firstDoc) {
      console.error("Document group copy response:", JSON.stringify(groupCopyResponse));
      throw new Error("No documents found in copied document group");
    }
    documentId = firstDoc;
  } else {
    // Step 1b: Copy single document template
    const copyResponse = await signnowFetch(`/template/${templateId}/copy`, {
      method: "POST",
      body: JSON.stringify({ document_name: documentName }),
    });
    documentId = copyResponse.id;
  }

  // Step 2: Get document details
  const docDetails = await signnowFetch(`/document/${documentId}`);
  const role = docDetails.roles?.[0];
  if (!role) throw new Error("No signing role found on template");

  // Step 3: Create embedded invite
  const inviteResponse = await signnowFetch(`/v2/documents/${documentId}/embedded-invites`, {
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
  });

  const inviteId =
    inviteResponse.data?.[0]?.id ||
    inviteResponse.invite_id ||
    inviteResponse.data?.id;
  if (!inviteId) throw new Error("Failed to create signing invite");

  // Step 4: Generate signing link
  const linkResponse = await signnowFetch(
    `/v2/documents/${documentId}/embedded-invites/${inviteId}/link`,
    {
      method: "POST",
      body: JSON.stringify({ auth_method: "none", link_expiration: 45 }),
    },
  );

  const signingLink =
    linkResponse.data?.link || linkResponse.link || linkResponse.signing_link;
  if (!signingLink) throw new Error("Failed to generate signing link");

  return { signingLink, documentId, inviteId };
}

export async function checkDocumentStatus(documentId: string): Promise<boolean> {
  const docDetails = await signnowFetch(`/document/${documentId}`);
  const fieldInvites = docDetails.field_invites || [];
  const allSigned =
    fieldInvites.length > 0 &&
    fieldInvites.every((invite: any) => invite.status === "fulfilled");
  return allSigned || docDetails.status === "signed";
}
