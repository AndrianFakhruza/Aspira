import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await db.getFormById(params.id);
    if (!form) {
      return NextResponse.json({ success: false, message: "Formulir tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, form });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await db.updateForm(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Formulir tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, form: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteForm(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

