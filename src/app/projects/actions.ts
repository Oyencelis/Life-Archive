"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProjectStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { resolveOwnedMediaId, syncCoverImage, cleanupMediaLinks } from "@/lib/storage/cover";

const ProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  goal: z.string().trim().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  whatILearned: z.string().trim().optional(),
  whyItEnded: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  coverMediaId: z.string().optional(),
});

function parseProjectForm(formData: FormData) {
  return ProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    goal: formData.get("goal"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    whatILearned: formData.get("whatILearned"),
    whyItEnded: formData.get("whyItEnded"),
    websiteUrl: formData.get("websiteUrl"),
    coverMediaId: formData.get("coverMediaId"),
  });
}

// Browsers already reject obviously-broken input on <input type="url">, so
// this just normalizes a bare domain ("example.com") into something that'll
// actually link out instead of resolving as a relative path.
function normalizeUrl(value: string | undefined): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function projectFields(data: z.infer<typeof ProjectSchema>) {
  return {
    name: data.name,
    description: data.description || null,
    goal: data.goal || null,
    status: (data.status as ProjectStatus) || ProjectStatus.ACTIVE,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    whatILearned: data.whatILearned || null,
    whyItEnded: data.whyItEnded || null,
    websiteUrl: normalizeUrl(data.websiteUrl),
  };
}

export async function createProject(
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data: Prisma.ProjectUncheckedCreateInput = {
    userId: session.user.id,
    ...projectFields(parsed.data),
  };
  const project = await prisma.project.create({ data });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await syncCoverImage("project", project.id, coverId);

  revalidatePath("/projects");
  return { href: `/projects/${project.id}` };
}

export async function updateProject(
  id: string,
  _prevState: { error?: string; href?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; href?: string }> {
  const session = await requireSession();
  const existing = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Project not found" };

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.project.update({ where: { id }, data: projectFields(parsed.data) });
  const coverId = await resolveOwnedMediaId(session.user.id, parsed.data.coverMediaId);
  await syncCoverImage("project", id, coverId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { href: `/projects/${id}` };
}

export async function deleteProject(id: string) {
  const session = await requireSession();
  const existing = await prisma.project.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return;

  await cleanupMediaLinks("project", id);
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  redirect("/projects");
}
