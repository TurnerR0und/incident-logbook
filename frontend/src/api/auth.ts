import { api } from "./client";
import type { Token, User } from "../types";

export function register(email: string, password: string): Promise<User> {
  return api.post<User>("/auth/register", { email, password });
}

export function login(email: string, password: string): Promise<Token> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return api.postForm<Token>("/auth/login", form);
}
