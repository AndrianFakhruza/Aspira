import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const members = await db.getMembers();
    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newMember = await db.addMember({
      workspace_id: body.workspace_id || "ws-1",
      full_name: body.full_name,
      email: body.email,
      role: body.role || "editor",
    });
    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

