import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { getSignedMediaUrls } from "@/lib/storage/media";
import { resolveMediaLinksForUser } from "@/lib/storage/resolve";
import { MediaGallery, type GalleryItem } from "./MediaGallery";

export default async function MediaPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const media = await prisma.media.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const [urls, linksByMedia] = await Promise.all([
    getSignedMediaUrls(media.map((m) => m.storageKey)),
    resolveMediaLinksForUser(
      userId,
      media.map((m) => m.id)
    ),
  ]);

  const items: GalleryItem[] = media
    .map((m) => ({
      id: m.id,
      type: m.type,
      url: urls.get(m.storageKey) ?? null,
      altText: m.altText,
      createdAt: m.createdAt.toISOString(),
      links: linksByMedia.get(m.id) ?? [],
    }))
    .filter((item): item is GalleryItem => item.url !== null);

  return (
    <div className="ed-shell">
      <MediaGallery initialItems={items} />
    </div>
  );
}
