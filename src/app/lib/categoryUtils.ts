import type { NexaCategory } from "../repositories/NexaCategoryRepository";

/** Flatten a NexaCategory tree into a Record<id, name>. */
export function buildCategoryMap(
    cats: NexaCategory[],
    map: Record<string, string> = {},
): Record<string, string> {
    for (const c of cats) {
        map[c.id] = c.name;
        if (c.subCategories?.length) buildCategoryMap(c.subCategories, map);
    }
    return map;
}
