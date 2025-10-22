// app/seed/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // <-- pure JS, safe everywhere
import postgres, { Sql } from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// ----- seeders accept the tx-scoped `sql` -----
async function seedUsers(tx: Sql) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await tx`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const { count } = await tx`
      INSERT INTO users (id, name, email, password)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${hashed})
      ON CONFLICT (id) DO NOTHING
      RETURNING 1;
    `.catch((e) => {
      console.error('users insert failed:', e);
      throw e;
    });
  }
}

async function seedCustomers(tx: Sql) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await tx`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  for (const c of customers) {
    await tx`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING;
    `.catch((e) => {
      console.error('customers insert failed:', e);
      throw e;
    });
  }
}

async function seedInvoices(tx: Sql) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await tx`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
      -- Optionally enforce FK if your placeholder data matches:
      -- , CONSTRAINT invoices_customer_fk
      --   FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `;

  // IMPORTANT: customers must be seeded before invoices
  for (const inv of invoices) {
    await tx`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING;
    `.catch((e) => {
      console.error('invoices insert failed:', e);
      throw e;
    });
  }
}

async function seedRevenue(tx: Sql) {
  await tx`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(10) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  for (const r of revenue) {
    await tx`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING;
    `.catch((e) => {
      console.error('revenue insert failed:', e);
      throw e;
    });
  }
}

export async function GET() {
  try {
    // Do everything in one transaction, in the correct order:
    await sql.begin(async (tx) => {
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return NextResponse.json({
      ok: true,
      message: 'Database seeded successfully',
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
