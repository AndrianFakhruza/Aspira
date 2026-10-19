import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const responses = await db.getResponses(params.id);
    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await db.getFormById(params.id);
    if (!form) {
      return NextResponse.json({ success: false, message: "Formulir tidak ditemukan" }, { status: 404 });
    }

    // 1. Status Check
    if (form.status !== "published") {
      return NextResponse.json(
        { success: false, message: "Formulir saat ini sedang tidak menerima respons (Status: " + form.status + ")" },
        { status: 400 }
      );
    }

    // 2. Schedule Check
    const now = new Date();
    if (form.opens_at && new Date(form.opens_at) > now) {
      return NextResponse.json(
        { success: false, message: "Formulir ini belum dibuka untuk pengisian." },
        { status: 400 }
      );
    }
    if (form.closes_at && new Date(form.closes_at) < now) {
      return NextResponse.json(
        { success: false, message: "Batas waktu pengisian formulir ini telah berakhir." },
        { status: 400 }
      );
    }

    // 3. Quota Check
    const existingResponses = await db.getResponses(form.id);
    if (form.settings.quota && existingResponses.length >= form.settings.quota) {
      return NextResponse.json(
        { success: false, message: "Batas kuota pengisian formulir ini telah tercapai." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { answers, respondent_name, respondent_email, turnstile_token } = body;

    // Optional Turnstile spam validation if secret key is configured
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstile_token) {
      try {
        const formData = new URLSearchParams();
        formData.append("secret", turnstileSecret);
        formData.append("response", turnstile_token);
        const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body: formData,
        });
        const cfData = await cfRes.json();
        if (!cfData.success) {
          return NextResponse.json(
            { success: false, message: "Verifikasi proteksi spam gagal. Silakan coba lagi." },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn("Turnstile check warning:", err);
      }
    }

    // Record response
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    const response = await db.submitResponse(form.id, answers, {
      respondent_name: form.settings.is_anonymous ? null : respondent_name,
      respondent_email: form.settings.is_anonymous ? null : respondent_email,
      ip_hash: Buffer.from(ip).toString("base64").substring(0, 16),
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      response,
      thank_you_message: form.settings.thank_you_message,
      redirect_url: form.settings.redirect_url,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

