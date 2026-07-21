"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addSupplier as addSupplierRepo,
  deleteSupplier as deleteSupplierRepo,
  savePurchaseOrder as savePurchaseOrderRepo,
  deletePurchaseOrder as deletePurchaseOrderRepo,
  type NewPurchaseOrderInput,
} from "@/lib/sheets/repository";

const AUTH_COOKIE = "ph_auth";

// =============================================================================
// AUTH (single shared password for the whole team -- no per-user accounts)
// =============================================================================
export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    throw new Error("APP_PASSWORD belum diset di Environment Variables.");
  }
  if (password !== expected) {
    return { error: "Password salah. Coba lagi." };
  }

  cookies().set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
    path: "/",
  });
  redirect("/dashboard");
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/login");
}

// =============================================================================
// SUPPLIER
// =============================================================================
export async function addSupplierAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Nama supplier wajib diisi" };

  await addSupplierRepo({
    name,
    code: String(formData.get("code") || ""),
    address: String(formData.get("address") || ""),
    pic_name: String(formData.get("pic") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    category: String(formData.get("category") || ""),
    payment_term: String(formData.get("payment_term") || ""),
    lead_time_days: String(formData.get("lead_time") || ""),
  });

  revalidatePath("/suppliers");
  return { success: true };
}

export async function deleteSupplierAction(id: string) {
  await deleteSupplierRepo(id);
  revalidatePath("/suppliers");
}

// =============================================================================
// PURCHASE ORDER
// =============================================================================
export async function savePurchaseOrderAction(input: NewPurchaseOrderInput) {
  await savePurchaseOrderRepo(input);
  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  revalidatePath("/items");
  revalidatePath("/price-history");
}

export async function deletePurchaseOrderAction(id: string) {
  await deletePurchaseOrderRepo(id);
  revalidatePath("/purchase-orders");
  revalidatePath("/dashboard");
  revalidatePath("/items");
  revalidatePath("/price-history");
}
