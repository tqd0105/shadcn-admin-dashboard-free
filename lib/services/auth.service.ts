import { supabase } from "../supabase/client";

/**
 * authService: wrapper quanh Supabase Auth.
 * Chỉ chứa các thao tác auth cơ bản.
 * Logic đăng ký (OTP, verify, create user) nằm trong register.service.ts → NestJS backend.
 */
export const authService = {
  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  async logout() {
    return supabase.auth.signOut();
  },
  async getUser() {
    return supabase.auth.getUser();
  },
  async getSession() {
    return supabase.auth.getSession();
  },
};