// Seeds only shipped presets — never personal content. Real archive data
// belongs to a real user account, created through /setup, not this script.
import { PrismaClient } from "@prisma/client";
import { THEME_PRESETS } from "../src/lib/theme/presets";

const prisma = new PrismaClient();

async function main() {
  for (const preset of THEME_PRESETS) {
    const existing = await prisma.theme.findFirst({
      where: { key: preset.key, isPreset: true },
    });

    if (existing) {
      await prisma.theme.update({
        where: { id: existing.id },
        data: { name: preset.name, tokens: preset.tokens as object },
      });
    } else {
      await prisma.theme.create({
        data: {
          key: preset.key,
          name: preset.name,
          isPreset: true,
          userId: null,
          tokens: preset.tokens as object,
        },
      });
    }
  }

  console.log(`Seeded ${THEME_PRESETS.length} preset themes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
