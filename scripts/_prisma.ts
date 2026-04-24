import { PrismaClient } from '../prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

type ClientOptions = Omit<NonNullable<ConstructorParameters<typeof PrismaClient>[0]>, 'adapter'>

export function createPrisma(options: Partial<ClientOptions> = {}) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter, ...options } as any)
}
