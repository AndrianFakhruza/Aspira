import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await db.getFormById(params.id);
    if (!form) {
      return NextResponse.json({ success: false, message: "Formulir tidak ditemukan" }, { status: 404 });
    }

    const responses = await db.getResponses(params.id);
    const format = req.nextUrl.searchParams.get("format") || "xlsx";
    const fields = form.fields || [];

    if (format === "csv") {
      const headers = [
        "No",
        "Tanggal Submit",
        "Nama Responden",
        "Email Responden",
        ...fields.map((f) => `"${f.label.replace(/"/g, '""')}"`),
      ];

      const rows = responses.map((resp, idx) => {
        const values = [
          idx + 1,
          `"${new Date(resp.submitted_at).toLocaleString("id-ID")}"`,
          `"${(resp.respondent_name || "Anonim").replace(/"/g, '""')}"`,
          `"${(resp.respondent_email || "-").replace(/"/g, '""')}"`,
          ...fields.map((f) => {
            const val = resp.answers[f.id];
            if (Array.isArray(val)) {
              return `"${val.join(", ").replace(/"/g, '""')}"`;
            }
            if (typeof val === "object" && val !== null) {
              return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            }
            return `"${String(val !== undefined && val !== null ? val : "-").replace(/"/g, '""')}"`;
          }),
        ];
        return values.join(",");
      });

      const csvData = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${form.slug}-respons.csv"`,
        },
      });
    }

    // Default: XLSX via ExcelJS on server
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Tanggap";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Respons");

    const columns = [
      { header: "No", key: "no", width: 8 },
      { header: "Tanggal Submit", key: "submitted_at", width: 22 },
      { header: "Nama Responden", key: "respondent_name", width: 24 },
      { header: "Email Responden", key: "respondent_email", width: 26 },
      ...fields.map((field) => ({
        header: field.label,
        key: field.id,
        width: Math.max(field.label.length + 5, 20),
      })),
    ];

    worksheet.columns = columns;

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0A0A" },
      };
      cell.font = {
        name: "Inter",
        color: { argb: "FFFFFFFF" },
        bold: true,
        size: 11,
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    responses.forEach((resp, idx) => {
      const rowData: Record<string, any> = {
        no: idx + 1,
        submitted_at: new Date(resp.submitted_at).toLocaleString("id-ID"),
        respondent_name: resp.respondent_name || "(Anonim)",
        respondent_email: resp.respondent_email || "(Tidak ada)",
      };

      fields.forEach((f) => {
        const val = resp.answers[f.id];
        if (Array.isArray(val)) {
          rowData[f.id] = val.join(", ");
        } else if (typeof val === "object" && val !== null) {
          rowData[f.id] = JSON.stringify(val);
        } else {
          rowData[f.id] = val !== undefined && val !== null ? val : "-";
        }
      });

      const row = worksheet.addRow(rowData);
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { name: "Inter", size: 10 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${form.slug}-respons.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

