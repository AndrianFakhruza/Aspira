import { Form, FormField, FormResponse } from "@/types";

export interface QuestionAnalysis {
  field: FormField;
  totalAnswered: number;
  data: { name: string; count: number; percentage: number }[];
  average?: number;
  npsScore?: number;
  npsBreakdown?: { promoters: number; passives: number; detractors: number };
  sampleTextAnswers?: string[];
}

export interface AnalyticsSummary {
  totalResponses: number;
  narrativePoints: { title: string; summary: string; detail?: string }[];
  questions: QuestionAnalysis[];
  dailyTrends: { date: string; count: number }[];
}

export function computeAnalytics(form: Form, responses: FormResponse[]): AnalyticsSummary {
  const fields = form.fields || [];
  const totalResponses = responses.length;

  // 1. Group responses by date for trend
  const dateMap: Record<string, number> = {};
  responses.forEach((r) => {
    const d = new Date(r.submitted_at).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
    });
    dateMap[d] = (dateMap[d] || 0) + 1;
  });
  const dailyTrends = Object.entries(dateMap).map(([date, count]) => ({ date, count }));

  // 2. Compute per-question analysis
  const questions: QuestionAnalysis[] = [];
  const narrativePoints: { title: string; summary: string; detail?: string }[] = [];

  fields.forEach((field) => {
    const answers = responses
      .map((r) => r.answers[field.id])
      .filter((val) => val !== undefined && val !== null && val !== "");
    const totalAnswered = answers.length;

    if (["radio", "select"].includes(field.type)) {
      const counts: Record<string, number> = {};
      (field.options || []).forEach((opt) => (counts[opt] = 0));
      answers.forEach((val) => {
        const strVal = String(val);
        counts[strVal] = (counts[strVal] || 0) + 1;
      });

      const data = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage: totalAnswered > 0 ? Number(((count / totalAnswered) * 100).toFixed(1)) : 0,
      }));

      questions.push({ field, totalAnswered, data });

      if (totalAnswered > 0) {
        const sorted = [...data].sort((a, b) => b.count - a.count);
        const top = sorted[0];
        if (top && top.count > 0) {
          narrativePoints.push({
            title: field.label,
            summary: `Mayoritas responden (${top.percentage}%) memilih "${top.name}".`,
            detail: `Sebanyak ${top.count} dari ${totalAnswered} responden memilih opsi ini.`,
          });
        }
      }
    } else if (field.type === "checkbox") {
      const counts: Record<string, number> = {};
      (field.options || []).forEach((opt) => (counts[opt] = 0));
      answers.forEach((val) => {
        if (Array.isArray(val)) {
          val.forEach((opt) => {
            counts[opt] = (counts[opt] || 0) + 1;
          });
        }
      });

      const data = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage: totalAnswered > 0 ? Number(((count / totalAnswered) * 100).toFixed(1)) : 0,
      }));

      questions.push({ field, totalAnswered, data });

      if (totalAnswered > 0) {
        const sorted = [...data].sort((a, b) => b.count - a.count);
        const top = sorted[0];
        if (top && top.count > 0) {
          narrativePoints.push({
            title: field.label,
            summary: `Pilihan terbanyak adalah "${top.name}" dengan total ${top.count} pemilih.`,
          });
        }
      }
    } else if (field.type === "rating") {
      let sum = 0;
      const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      answers.forEach((val) => {
        const num = Number(val);
        if (!isNaN(num)) {
          sum += num;
          counts[String(num)] = (counts[String(num)] || 0) + 1;
        }
      });

      const avg = totalAnswered > 0 ? Number((sum / totalAnswered).toFixed(2)) : 0;
      const data = Object.entries(counts).map(([name, count]) => ({
        name: `${name} Bintang`,
        count,
        percentage: totalAnswered > 0 ? Number(((count / totalAnswered) * 100).toFixed(1)) : 0,
      }));

      questions.push({ field, totalAnswered, data, average: avg });

      if (totalAnswered > 0) {
        narrativePoints.push({
          title: field.label,
          summary: `Skor rata-rata adalah ${avg} dari 5.0.`,
          detail: `Berdasarkan ${totalAnswered} responden yang memberikan penilaian.`,
        });
      }
    } else if (field.type === "linear_scale") {
      // NPS / Scale calculation
      let sum = 0;
      let promoters = 0; // 9-10
      let passives = 0; // 7-8
      let detractors = 0; // 0-6

      const counts: Record<string, number> = {};
      const min = field.linear_scale_min ?? 0;
      const max = field.linear_scale_max ?? 10;
      for (let i = min; i <= max; i++) {
        counts[String(i)] = 0;
      }

      answers.forEach((val) => {
        const num = Number(val);
        if (!isNaN(num)) {
          sum += num;
          counts[String(num)] = (counts[String(num)] || 0) + 1;
          if (num >= 9) promoters++;
          else if (num >= 7) passives++;
          else detractors++;
        }
      });

      const avg = totalAnswered > 0 ? Number((sum / totalAnswered).toFixed(1)) : 0;
      const npsScore =
        totalAnswered > 0
          ? Math.round(((promoters - detractors) / totalAnswered) * 100)
          : 0;

      const data = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage: totalAnswered > 0 ? Number(((count / totalAnswered) * 100).toFixed(1)) : 0,
      }));

      questions.push({
        field,
        totalAnswered,
        data,
        average: avg,
        npsScore,
        npsBreakdown: { promoters, passives, detractors },
      });

      if (totalAnswered > 0) {
        narrativePoints.push({
          title: field.label,
          summary: `Skor NPS adalah ${npsScore > 0 ? "+" : ""}${npsScore} (Rata-rata: ${avg}/${max}).`,
          detail: `Promoter: ${promoters}, Passive: ${passives}, Detractor: ${detractors}.`,
        });
      }
    } else if (["text", "textarea"].includes(field.type)) {
      const sampleTextAnswers = answers.slice(0, 10).map((v) => String(v));
      questions.push({ field, totalAnswered, data: [], sampleTextAnswers });

      if (totalAnswered > 0) {
        narrativePoints.push({
          title: field.label,
          summary: `Terdapat ${totalAnswered} masukan teks yang diterima.`,
        });
      }
    }
  });

  return {
    totalResponses,
    narrativePoints,
    questions,
    dailyTrends,
  };
}

