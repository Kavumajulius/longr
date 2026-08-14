"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export type AuthUser = User | null | undefined;

export function useAuth(): AuthUser {
  const [user, setUser] = useState<AuthUser>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (current) => setUser(current));
    return unsubscribe;
  }, []);

  return user;
}
