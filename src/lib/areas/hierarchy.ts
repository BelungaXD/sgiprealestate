export const AREA_MAX_DEPTH = 3

export type AreaHierarchyError =
  | 'self_parent'
  | 'parent_not_found'
  | 'cycle_detected'
  | 'max_depth_exceeded'

// Minimal Prisma-like surface this module needs. The shared `prisma` export in
// `src/lib/prisma.ts` is typed as a Proxy with `[key: string]: unknown`, so we
// describe just the calls used here to stay compatible with both that proxy
// and the generated `PrismaClient`.
type AreaParentLookup = {
  area: {
    findUnique: (args: {
      where: { id: string }
      select: { parentId: true }
    }) => Promise<{ parentId: string | null } | null>
    findMany: (args: {
      where: { parentId: string }
      select: { id: true }
    }) => Promise<{ id: string }[]>
  }
}

/**
 * Compute depth (1 = root) of a hypothetical area whose parent chain starts at `parentId`.
 * Walks up the tree using the provided Prisma client; rejects cycles and missing parents.
 */
async function depthOfParent(
  prisma: AreaParentLookup,
  parentId: string
): Promise<{ depth: number; ancestors: string[] } | AreaHierarchyError> {
  const ancestors: string[] = []
  let cursor: string | null = parentId
  while (cursor) {
    if (ancestors.includes(cursor)) return 'cycle_detected'
    ancestors.push(cursor)
    if (ancestors.length > AREA_MAX_DEPTH + 1) return 'max_depth_exceeded'
    const parent: { parentId: string | null } | null = await prisma.area.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    })
    if (!parent) return 'parent_not_found'
    cursor = parent.parentId
  }
  return { depth: ancestors.length + 1, ancestors }
}

/**
 * Subtree depth (number of generations below `areaId`, root included = 1).
 * Returns 1 for a leaf area.
 */
async function subtreeDepth(prisma: AreaParentLookup, areaId: string): Promise<number> {
  const stack: { id: string; depth: number }[] = [{ id: areaId, depth: 1 }]
  let max = 1
  while (stack.length) {
    const node = stack.pop()!
    if (node.depth > max) max = node.depth
    const children = await prisma.area.findMany({
      where: { parentId: node.id },
      select: { id: true },
    })
    for (const child of children) {
      stack.push({ id: child.id, depth: node.depth + 1 })
    }
  }
  return max
}

/**
 * Validate a parentId assignment for either a new area (areaId omitted) or an existing one.
 * Returns null when OK, otherwise an error code.
 */
export async function validateAreaParent(
  prisma: AreaParentLookup,
  parentId: string | null,
  areaId?: string
): Promise<AreaHierarchyError | null> {
  if (!parentId) return null
  if (areaId && parentId === areaId) return 'self_parent'

  const parentChain = await depthOfParent(prisma, parentId)
  if (typeof parentChain === 'string') return parentChain
  if (areaId && parentChain.ancestors.includes(areaId)) return 'cycle_detected'

  const newDepth = parentChain.depth
  if (newDepth > AREA_MAX_DEPTH) return 'max_depth_exceeded'

  if (areaId) {
    const subtree = await subtreeDepth(prisma, areaId)
    if (newDepth + subtree - 1 > AREA_MAX_DEPTH) return 'max_depth_exceeded'
  }
  return null
}
