import { Form, FormField, FormResponse, Profile, Workspace, AuditLog, FormStatus } from "@/types";
import { initialForms, initialProfiles, initialResponses, initialWorkspace, initialAuditLogs } from "./storage/mock-data";
import { createClient as createBrowserClient } from "./supabase/client";
import { createAdminClient } from "./supabase/admin";

// In-memory persistent state across requests in Node dev environment
let memoryWorkspace: Workspace = { ...initialWorkspace };
let memoryProfiles: Profile[] = [...initialProfiles];
let memoryForms: Form[] = [...initialForms];
let memoryResponses: FormResponse[] = [...initialResponses];
let memoryAuditLogs: AuditLog[] = [...initialAuditLogs];

const isUUID = (str?: string): boolean =>
  typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function normalizeFields(rawFields?: any[]): FormField[] {
  return (rawFields || [])
    .map((f: any) => ({
      ...f,
      options: Array.isArray(f.options) ? f.options : [],
      logic: Array.isArray(f.logic) ? f.logic : [],
      validation: typeof f.validation === "object" && f.validation !== null ? f.validation : {},
    }))
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
}

export const db = {
  // --- WORKSPACE ---
  async getWorkspace(): Promise<Workspace> {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("workspaces").select("*").limit(1).single();
        if (!error && data) return data as Workspace;

        // Seed initial default workspace if empty
        const { data: created } = await supabase
          .from("workspaces")
          .insert({ name: "Organisasi Tanggap" })
          .select()
          .single();
        if (created) return created as Workspace;
      } catch (e) {
        console.error("Supabase getWorkspace error:", e);
      }
    }
    return memoryWorkspace;
  },

  async updateWorkspace(updates: Partial<Workspace>): Promise<Workspace> {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const ws = await this.getWorkspace();
        const { data, error } = await supabase
          .from("workspaces")
          .update(updates)
          .eq("id", ws.id)
          .select()
          .single();
        if (!error && data) return data as Workspace;
      } catch (e) {
        console.error("Supabase updateWorkspace error:", e);
      }
    }
    memoryWorkspace = { ...memoryWorkspace, ...updates };
    return memoryWorkspace;
  },

  // --- FORMS ---
  async getForms(): Promise<Form[]> {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*, form_fields(*)")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((f: any) => ({
            ...f,
            fields: normalizeFields(f.form_fields),
            responses_count: memoryResponses.filter((r) => r.form_id === f.id).length,
          }));
        }
      } catch (e) {
        console.error("Supabase getForms error:", e);
      }
    }
    return memoryForms.map((f) => ({
      ...f,
      fields: normalizeFields(f.fields),
      responses_count: memoryResponses.filter((r) => r.form_id === f.id).length,
    }));
  },

  async getFormById(id: string): Promise<Form | null> {
    const supabase = createAdminClient();
    if (supabase && isUUID(id)) {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*, form_fields(*)")
          .eq("id", id)
          .single();
        if (!error && data) {
          return {
            ...data,
            fields: normalizeFields(data.form_fields),
            responses_count: memoryResponses.filter((r) => r.form_id === data.id).length,
          };
        }
      } catch (e) {
        console.error("Supabase getFormById error:", e);
      }
    }
    const form = memoryForms.find((f) => f.id === id);
    if (!form) return null;
    return {
      ...form,
      fields: normalizeFields(form.fields),
      responses_count: memoryResponses.filter((r) => r.form_id === form.id).length,
    };
  },

  async getFormBySlug(slug: string): Promise<Form | null> {
    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("forms")
          .select("*, form_fields(*)")
          .eq("slug", slug)
          .single();
        if (!error && data) {
          return {
            ...data,
            fields: normalizeFields(data.form_fields),
          };
        }
      } catch (e) {
        console.error("Supabase getFormBySlug error:", e);
      }
    }
    const form = memoryForms.find((f) => f.slug === slug);
    if (!form) return null;
    return {
      ...form,
      fields: normalizeFields(form.fields),
    };
  },

  async createForm(formData: Partial<Form>): Promise<Form> {
    const ws = await this.getWorkspace();
    const newId = crypto.randomUUID();
    const slug =
      formData.slug ||
      formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
      `form-${Date.now().toString().slice(-6)}`;

    const preparedFields: FormField[] = (formData.fields || []).map((field, idx) => ({
      ...field,
      id: isUUID(field.id) ? field.id : crypto.randomUUID(),
      form_id: newId,
      position: idx + 1,
      section: field.section || 1,
    }));

    const newForm: Form = {
      id: newId,
      workspace_id: ws.id,
      owner_id: "user-1",
      title: formData.title || "Formulir Baru",
      description: formData.description || "",
      slug,
      status: formData.status || "draft",
      banner_url: formData.banner_url || null,
      settings: formData.settings || {
        is_anonymous: false,
        show_branding: true,
        limit_one_response: false,
        quota: null,
        thank_you_message: "Terima kasih atas partisipasi Anda dalam mengisi survei ini.",
        redirect_url: null,
        notify_admin_email: null,
      },
      opens_at: formData.opens_at || null,
      closes_at: formData.closes_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: preparedFields,
      responses_count: 0,
    };

    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("forms").insert({
          id: newForm.id,
          workspace_id: isUUID(ws.id) ? ws.id : undefined,
          title: newForm.title,
          description: newForm.description,
          slug: newForm.slug,
          status: newForm.status,
          banner_url: newForm.banner_url,
          settings: newForm.settings,
          opens_at: newForm.opens_at,
          closes_at: newForm.closes_at,
        }).select().single();

        if (!error && data && preparedFields.length) {
          await supabase.from("form_fields").insert(
            preparedFields.map((field) => ({
              id: field.id,
              form_id: data.id,
              position: field.position,
              type: field.type,
              label: field.label,
              help_text: field.help_text || "",
              required: field.required ?? false,
              options: field.options || [],
              section: field.section || 1,
            }))
          );
        }
      } catch (err) {
        console.error("Supabase createForm error:", err);
      }
    }

    memoryForms.unshift(newForm);
    await this.logAudit("create", "form", newForm.id, { title: newForm.title });
    return newForm;
  },

  async updateForm(id: string, updates: Partial<Form>): Promise<Form | null> {
    const formIndex = memoryForms.findIndex((f) => f.id === id);
    let currentForm = formIndex !== -1 ? memoryForms[formIndex] : null;

    if (!currentForm && isUUID(id)) {
      currentForm = await this.getFormById(id);
    }
    if (!currentForm) return null;

    const updatedForm: Form = {
      ...currentForm,
      ...updates,
      updated_at: new Date().toISOString(),
      fields: updates.fields !== undefined ? updates.fields : currentForm.fields,
    };

    if (formIndex !== -1) {
      memoryForms[formIndex] = updatedForm;
    } else {
      memoryForms.unshift(updatedForm);
    }

    const supabase = createAdminClient();
    if (supabase && isUUID(id)) {
      try {
        await supabase.from("forms").update({
          title: updatedForm.title,
          description: updatedForm.description,
          slug: updatedForm.slug,
          status: updatedForm.status,
          banner_url: updatedForm.banner_url,
          settings: updatedForm.settings,
          opens_at: updatedForm.opens_at,
          closes_at: updatedForm.closes_at,
          updated_at: updatedForm.updated_at,
        }).eq("id", id);

        if (updates.fields) {
          await supabase.from("form_fields").delete().eq("form_id", id);
          if (updates.fields.length > 0) {
            await supabase.from("form_fields").insert(
              updates.fields.map((f, i) => ({
                id: isUUID(f.id) ? f.id : crypto.randomUUID(),
                form_id: id,
                position: i + 1,
                type: f.type,
                label: f.label,
                help_text: f.help_text || "",
                required: f.required ?? false,
                options: f.options || [],
                section: f.section || 1,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Supabase updateForm error:", err);
      }
    }

    await this.logAudit("update", "form", id, { title: updatedForm.title, status: updatedForm.status });
    return updatedForm;
  },

  async deleteForm(id: string): Promise<boolean> {
    const form = memoryForms.find((f) => f.id === id);
    memoryForms = memoryForms.filter((f) => f.id !== id);
    memoryResponses = memoryResponses.filter((r) => r.form_id !== id);

    const supabase = createAdminClient();
    if (supabase && isUUID(id)) {
      try {
        await supabase.from("forms").delete().eq("id", id);
      } catch (err) {
        console.error("Supabase deleteForm error:", err);
      }
    }

    if (form) {
      await this.logAudit("delete", "form", id, { title: form.title });
    }
    return true;
  },

  async duplicateForm(id: string): Promise<Form | null> {
    const original = await this.getFormById(id);
    if (!original) return null;

    const duplicated = await this.createForm({
      ...original,
      title: `${original.title} (Salinan)`,
      slug: `${original.slug}-salinan-${Date.now().toString().slice(-4)}`,
      status: "draft",
      fields: (original.fields || []).map((f) => ({
        ...f,
        id: crypto.randomUUID(),
      })),
    });

    return duplicated;
  },

  // --- RESPONSES ---
  async getResponses(formId: string): Promise<FormResponse[]> {
    const supabase = createAdminClient();
    if (supabase && isUUID(formId)) {
      try {
        const { data, error } = await supabase
          .from("responses")
          .select("*")
          .eq("form_id", formId)
          .order("submitted_at", { ascending: false });
        if (!error && data) return data as FormResponse[];
      } catch (err) {
        console.error("Supabase getResponses error:", err);
      }
    }
    return memoryResponses
      .filter((r) => r.form_id === formId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  },

  async getAllResponses(): Promise<FormResponse[]> {
    return memoryResponses;
  },

  async submitResponse(
    formId: string,
    answers: Record<string, any>,
    meta?: { respondent_name?: string; respondent_email?: string; ip_hash?: string; user_agent?: string }
  ): Promise<FormResponse> {
    const newResponse: FormResponse = {
      id: crypto.randomUUID(),
      form_id: formId,
      submitted_at: new Date().toISOString(),
      respondent_name: meta?.respondent_name || null,
      respondent_email: meta?.respondent_email || null,
      ip_hash: meta?.ip_hash || "hash_" + Math.random().toString(36).substring(2, 8),
      user_agent: meta?.user_agent || "Client",
      answers,
    };

    const supabase = createAdminClient();
    if (supabase && isUUID(formId)) {
      try {
        await supabase.from("responses").insert(newResponse);
      } catch (err) {
        console.error("Supabase submitResponse error:", err);
      }
    }

    memoryResponses.unshift(newResponse);

    // Update responses_count in form
    const form = memoryForms.find((f) => f.id === formId);
    if (form) {
      form.responses_count = (form.responses_count || 0) + 1;
    }
    return newResponse;
  },

  async deleteResponse(id: string): Promise<boolean> {
    const response = memoryResponses.find((r) => r.id === id);
    memoryResponses = memoryResponses.filter((r) => r.id !== id);

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("responses").delete().eq("id", id);
    }

    if (response) {
      await this.logAudit("delete", "response", id, { form_id: response.form_id });
    }
    return true;
  },

  // --- PROFILES / MEMBERS ---
  async getMembers(): Promise<Profile[]> {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (!error && data) return data as Profile[];
    }
    return memoryProfiles;
  },

  async addMember(profile: Omit<Profile, "id" | "created_at">): Promise<Profile> {
    const newMember: Profile = {
      ...profile,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("profiles").insert(newMember);
    }

    memoryProfiles.push(newMember);
    await this.logAudit("invite", "member", newMember.id, { email: newMember.email, role: newMember.role });
    return newMember;
  },

  async updateMemberRole(id: string, role: Profile["role"]): Promise<Profile | null> {
    const member = memoryProfiles.find((m) => m.id === id);
    if (!member) return null;
    member.role = role;

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("profiles").update({ role }).eq("id", id);
    }

    await this.logAudit("update_role", "member", id, { role });
    return member;
  },

  async removeMember(id: string): Promise<boolean> {
    const member = memoryProfiles.find((m) => m.id === id);
    if (!member) return false;
    memoryProfiles = memoryProfiles.filter((m) => m.id !== id);

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("profiles").delete().eq("id", id);
    }

    await this.logAudit("remove", "member", id, { email: member.email });
    return true;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return memoryAuditLogs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async logAudit(action: string, entity: string, entity_id?: string, meta?: Record<string, any>) {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      workspace_id: memoryWorkspace.id,
      actor_id: "user-1",
      actor_name: "Admin Utama",
      action,
      entity,
      entity_id,
      meta,
      created_at: new Date().toISOString(),
    };
    memoryAuditLogs.unshift(log);
  },
};

