import { supabase } from "@/lib/supabase";

export type ActiveSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  userAgent: string | null;
  ip: string | null;
  isCurrent: boolean;
};

type SessionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
};

export async function fetchMySessions(): Promise<
  { ok: true; sessions: ActiveSession[] } | { ok: false; error: string }
> {
  const { data, error } = await supabase.rpc("get_my_sessions");
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as SessionRow[];
  return {
    ok: true,
    sessions: rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userAgent: r.user_agent,
      ip: r.ip,
      isCurrent: r.is_current,
    })),
  };
}

export async function revokeSession(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("revoke_my_session", {
    target_session_id: sessionId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Very rough device/browser label from a user_agent string — good enough for a settings list, not a full UA parser. */
export function describeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android device";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown device";
}
