"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { nanoid } from "nanoid";

const RegisterSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type RegisterInput = z.infer<typeof RegisterSchema>;

export async function registerUser(values: RegisterInput) {
  const validated = RegisterSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: "Invalid form data" };
  }

  const { companyName, name, email, password } = validated.data;

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "Email already in use" };

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = companyName.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "") + "-" + nanoid(5);

    const organization = await db.organization.create({
      data: {
        name: companyName,
        slug,
      },
    });

    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: "OWNER",
        organizationId: organization.id,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}
