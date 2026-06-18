"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtp, register as registerUser } from "@/lib/services/register.service";
import { authService } from "@/lib/services/auth.service";

type RegisterStep = 1 | 2 | 3;

type RegisterState = {
  step: RegisterStep;
  email: string;
  otp: string;
  tempToken: string;
  password: string;
  loading: boolean;
  error: string;
};

function isResponse(value: unknown): value is Response {
  return typeof Response !== "undefined" && value instanceof Response;
}

async function getErrorMessage(value: unknown, fallbackMessage: string): Promise<string> {
  if (isResponse(value)) {
    const data = (await value.json().catch(() => null)) as { message?: string } | null;
    return data?.message ?? fallbackMessage;
  }
  return fallbackMessage;
}

export function useRegister() {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>({
    step: 1,
    email: "",
    otp: "",
    tempToken: "",
    password: "",
    loading: false,
    error: "",
  });

  const setError = useCallback((message: string) => {
    setState((current) => ({ ...current, error: message }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((current) => ({ ...current, loading }));
  }, []);

  const requestOtp = useCallback(async (emailInput: string) => {
    setLoading(true);
    setState((current) => ({ ...current, email: emailInput, error: "" }));

    try {
      const resp = await sendOtp(emailInput);
      if (!resp.ok) {
        throw new Error(await getErrorMessage(resp, "Failed to send OTP"));
      }
      setState((current) => ({ ...current, step: 2 }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const confirmOtp = useCallback(async (otpInput: string) => {
    setLoading(true);
    setState((current) => ({ ...current, otp: otpInput, error: "" }));

    try {
      const result = await verifyOtp(state.email, otpInput);
      if (isResponse(result)) {
        throw new Error(await getErrorMessage(result, "Invalid OTP"));
      }

      const data = result as { temp_token: string };
      if (!data?.temp_token) {
        throw new Error("Invalid OTP response");
      }

      setState((current) => ({
        ...current,
        tempToken: data.temp_token,
        step: 3,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, state.email]);

  const completeRegister = useCallback(
    async (name: string, passwordInput: string) => {
      setLoading(true);
      setState((current) => ({ ...current, password: passwordInput, error: "" }));

      try {
        const registerResult = await registerUser(name, state.email, passwordInput, state.tempToken);
        if (isResponse(registerResult)) {
          throw new Error(await getErrorMessage(registerResult, "Registration failed"));
        }

        const loginResult = await authService.login(state.email, passwordInput);
        if (loginResult.error) {
          throw new Error(loginResult.error.message);
        }

        router.replace("/dashboard");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, router, state.email, state.tempToken]
  );

  return {
    step: state.step,
    email: state.email,
    otp: state.otp,
    password: state.password,
    loading: state.loading,
    error: state.error,
    requestOtp,
    confirmOtp,
    completeRegister,
  };
}
