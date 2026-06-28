import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type RemoteCheck = {
  section_name: string;
  check_date: string;
  data: Json;
};

export type RemoteStruct = {
  section_name: string;
  data: Json;
};

export const getAllChecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RemoteCheck[]> => {
    const { data, error } = await context.supabase
      .from("section_checks")
      .select("section_name, check_date, data");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAllStructs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RemoteStruct[]> => {
    const { data, error } = await context.supabase
      .from("section_structs")
      .select("section_name, data");
    if (error) throw new Error(error.message);
    return data ?? [];
  });


const checkSchema = z.object({
  section_name: z.string().min(1),
  check_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data: z.any(),
});

export const upsertCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => checkSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("section_checks").upsert(
      {
        section_name: data.section_name,
        check_date: data.check_date,
        data: data.data,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "section_name,check_date" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const structSchema = z.object({
  section_name: z.string().min(1),
  data: z.any(),
});

export const upsertStruct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => structSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("section_structs").upsert(
      {
        section_name: data.section_name,
        data: data.data,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "section_name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
