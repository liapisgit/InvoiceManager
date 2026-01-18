import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config/env';

// const connectionString = process.env.DATABASE_URL;
// if (!connectionString || typeof connectionString !== 'string') {
//     throw new Error('DATABASE_URL environment variable is required and must be a string');
//   }
const adapter = new PrismaPg({ 
  connectionString: "postgresql://postgres:QiUwrtjlchL7jwBAXN7R@localhost:5432/invoice_manager"
});

let dbClient: PrismaClient;

if (process.env.NODE_ENV === "production") {
  dbClient = new PrismaClient({ adapter });
} else {
  // @ts-ignore
  if (!global.__dbClient) {
    // @ts-ignore
    global.__dbClient = new PrismaClient({ adapter });
  }
  // @ts-ignore
  dbClient = global.__dbClient;
}

export { dbClient };
