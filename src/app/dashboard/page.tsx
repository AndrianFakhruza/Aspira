import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await db.getWorkspace();
  const forms = await db.getForms();
  const allResponses = await db.getAllResponses();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceName={workspace.name} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Dashboard" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <DashboardView forms={forms} allResponses={allResponses} />
        </main>
      </div>
    </div>
  );
}
