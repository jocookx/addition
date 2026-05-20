import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/server/auth/require-admin";
import { getCsvTemplate } from "@/server/cms/csv-bulk";

type RouteContext = {
  params: Promise<{ entity: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  const { entity } = await context.params;
  const template = getCsvTemplate(entity);
  if (!template) {
    return NextResponse.json({ error: "Unknown CSV template." }, { status: 404 });
  }

  return new NextResponse(template.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.fileName}"`,
    },
  });
}
