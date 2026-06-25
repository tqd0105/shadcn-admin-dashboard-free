import { supabase } from "../supabase/client";

export type NotificationType = 'order' | 'promotion' | 'system' | 'alert' | 'coupon' | 'welcome' | 'review';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export async function getUserNotifications(userId: string) {
  return supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function markNotificationAsRead(id: string) {
  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
}

export async function markAllNotificationsAsRead(userId: string) {
  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId);
}

export async function getUnreadCount(userId: string) {
  return supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

// Admin / System function to send a broadcast notification
// This will fetch all users and insert a notification for each
export async function broadcastNotification(payload: {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  // 1. Fetch all user IDs
  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id");

  if (fetchError) throw fetchError;
  if (!profiles || profiles.length === 0) return { data: null, error: null };

  // 2. Prepare payload for all users
  const notificationsToInsert = profiles.map(profile => ({
    user_id: profile.id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    link: payload.link,
  }));

  // 3. Bulk insert
  return supabase
    .from("notifications")
    .insert(notificationsToInsert);
}

export async function getBroadcastHistory() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { data: null, error };

  // Filter unique by title + message
  const uniqueMap = new Map();
  data?.forEach(item => {
    const key = `${item.title}|${item.message}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return { data: Array.from(uniqueMap.values()), error: null };
}

export async function sendTargetedNotification(userId: string, payload: {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  return supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link,
    });
}

export async function deleteNotification(id: string) {
  return supabase
    .from("notifications")
    .delete()
    .eq("id", id);
}

export async function deleteBroadcast(title: string, message: string) {
  return supabase
    .from("notifications")
    .delete()
    .eq("title", title)
    .eq("message", message);
}

export async function searchUsersForNotification(query: string) {
  return supabase
    .from("profiles")
    .select("id, full_name, email")
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);
}

