import { clsx, type ClassValue } from "clsx"
import { useEffect } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchUser() {
  try {
    const authUrl = import.meta.env.VITE_AUTH_URL;
    if (!authUrl) {
      console.error("VITE_AUTH_URL is not defined in .env");
      return null;
    }

    const res = await fetch(authUrl + "/check-auth", {
      method: "GET",
      credentials: "include", // important if auth uses cookies/session
    });
    const data = await res.json();
    if (data.logged_in && data.user) {
      // console.log("Fetched user:", data.user);
      return data.user;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
  return null;
}

export async function isAdmin(): Promise<boolean> {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAIL
    ? import.meta.env.VITE_ADMIN_EMAIL.split(",").map((email: string) => email.trim())
    : [];

  const user = await fetchUser();
  if (!user || !user.email) {
    return false;
  }

  return adminEmails.includes(user.email);
}