import { errorResponse, okResponse } from "@/lib/http";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { importCsvRows } from "@/server/cms/csv-bulk";

type RouteContext = {
  params: Promise<{ entity: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { entity } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorResponse("CSV file is required.", 400);
    if (file.size > 2 * 1024 * 1024) return errorResponse("CSV file must be smaller than 2MB.", 400);

    const csv = await file.text();
    const result = await importCsvRows(entity, csv);
    return okResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "CSV import failed.", 400);
  }
}
