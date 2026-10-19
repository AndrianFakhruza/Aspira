import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const duplicated = await db.duplicateForm(params.id);
    if (!duplicated) {
      return NextResponse.json({ success: false, message: "Gagal menduplikasi form" }, { status: 404 });
    }
    return NextResponse.json({ success: true, form: duplicated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

