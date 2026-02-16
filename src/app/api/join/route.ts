import { NextResponse } from "next/server";
import { google } from "googleapis";
import { z } from "zod/v3";

import { businessFormSchema } from "@/lib/validations/business-form";

const joinPayloadExtrasSchema = z.object({
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  Not_USA: z.union([z.literal(0), z.literal(1)]),
});

type JoinPayload = Omit<z.infer<typeof businessFormSchema>, "tags"> & {
  tags: string[];
  Not_USA: 0 | 1;
};

const HEADER_COLUMNS = [
  "business_name",
  "Category",
  "description",
  "products",
  "website",
  "phone",
  "email",
  "contact_first",
  "contact_last",
  "street",
  "street2",
  "city",
  "state",
  "zip_code",
  "tags",
  "African_American",
  "Women-American",
  "type_of_business",
  "is_usa_based",
  "Not_USA",
  "consent_marketing",
  "facebook",
  "instagram",
  "linkedin",
  "keywords",
  "has_multiple_locations",
  "additional_locations",
] as const;

function toBooleanCell(value: boolean): string {
  return value ? "Yes" : "No";
}

function rowFromPayload(payload: JoinPayload): string[] {
  return [
    payload.business_name,
    payload.Category,
    payload.description,
    payload.products,
    payload.website,
    payload.phone,
    payload.email,
    payload.contact_first,
    payload.contact_last,
    payload.street,
    payload.street2 ?? "",
    payload.city,
    payload.state,
    payload.zip_code,
    payload.tags.join(", "),
    toBooleanCell(payload.African_American),
    toBooleanCell(payload["Women-American"]),
    payload.type_of_business,
    toBooleanCell(payload.is_usa_based),
    String(payload.Not_USA),
    toBooleanCell(payload.consent_marketing),
    payload.facebook,
    payload.instagram,
    payload.linkedin,
    payload.keywords.join(", "),
    toBooleanCell(payload.has_multiple_locations),
    JSON.stringify(payload.additional_locations),
  ];
}

function getGoogleServiceAccountCredentials() {
  const credentialsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!credentialsRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable.");
  }

  let jsonString: string;
  const trimmed = credentialsRaw.trim();
  if (trimmed.startsWith("{")) {
    jsonString = credentialsRaw;
  } else {
    try {
      jsonString = Buffer.from(credentialsRaw, "base64").toString("utf8");
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid base64.");
    }
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(jsonString) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (credentials.private_key && typeof credentials.private_key === "string") {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  return credentials;
}

async function appendSubmissionRow(payload: JoinPayload) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME ?? "Sheet1";

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleServiceAccountCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const rowValues = rowFromPayload(payload);
  const range = `${sheetName}!A:Z`;

  const firstRow = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });
  const hasHeader =
    firstRow.data.values && firstRow.data.values.length > 0 && firstRow.data.values[0]?.length > 0;

  const rowsToAppend = hasHeader ? [rowValues] : [[...HEADER_COLUMNS], rowValues];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rowsToAppend,
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const parsedExtras = joinPayloadExtrasSchema.safeParse(body);

  if (!parsedExtras.success) {
    return NextResponse.json(
      {
        error: "Invalid payload.",
        details: parsedExtras.error.flatten(),
      },
      { status: 400 }
    );
  }

  const parsedBusinessPayload = businessFormSchema.safeParse({
    ...(body as Record<string, unknown>),
    tags: parsedExtras.data.tags.join(", "),
  });

  if (!parsedBusinessPayload.success) {
    return NextResponse.json(
      {
        error: "Invalid payload.",
        details: parsedBusinessPayload.error.flatten(),
      },
      { status: 400 }
    );
  }

  const parsedPayload: JoinPayload = {
    ...parsedBusinessPayload.data,
    tags: parsedExtras.data.tags,
    Not_USA: parsedExtras.data.Not_USA,
  };

  try {
    await appendSubmissionRow(parsedPayload);

    return NextResponse.json(
      {
        ok: true,
        columns: HEADER_COLUMNS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to append submission row:", error);
    return NextResponse.json(
      { error: "Failed to save submission. Please try again." },
      { status: 500 }
    );
  }
}
