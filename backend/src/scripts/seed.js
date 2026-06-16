import bcrypt from "bcrypt";
import pool from "../config/database.js";

const SALT_ROUNDS = 10;

const users = [
  {
    email: "admin@lilticket.test",
    fullName: "Admin LilTicket",
    password: "admin12345",
    role: "ADMIN",
  },
  {
    email: "customer@lilticket.test",
    fullName: "Customer Demo",
    password: "Customer12345!",
    role: "CUSTOMER",
  },
];

const categories = [
  {
    description: "Konser musik pop, rock, jazz, dan genre populer lainnya.",
    name: "Music Concert",
  },
  {
    description: "Festival outdoor dengan beberapa panggung dan tenant.",
    name: "Festival",
  },
  {
    description: "Event seni, budaya, dan pertunjukan kreatif.",
    name: "Arts & Culture",
  },
  {
    description: "Seminar, konferensi, dan talkshow profesional.",
    name: "Conference",
  },
];

const venues = [
  {
    address: "Jl. Pintu Satu Senayan, Gelora, Jakarta Pusat",
    capacity: 15000,
    city: "Jakarta",
    id: "11111111-1111-4111-8111-111111111111",
    name: "Istora Senayan",
    province: "DKI Jakarta",
  },
  {
    address: "Jl. Gatot Subroto No. 1, Senayan, Jakarta Pusat",
    capacity: 60000,
    city: "Jakarta",
    id: "22222222-2222-4222-8222-222222222222",
    name: "Gelora Bung Karno Main Stadium",
    province: "DKI Jakarta",
  },
  {
    address: "Jl. Gatot Subroto No. 289, Bandung",
    capacity: 3000,
    city: "Bandung",
    id: "33333333-3333-4333-8333-333333333333",
    name: "Trans Convention Centre Bandung",
    province: "Jawa Barat",
  },
  {
    address: "Jl. Basuki Rahmat No. 93-105, Surabaya",
    capacity: 5000,
    city: "Surabaya",
    id: "44444444-4444-4444-8444-444444444444",
    name: "Dyandra Convention Center Surabaya",
    province: "Jawa Timur",
  },
];

const events = [
  {
    posterUrl: "https://picsum.photos/seed/lilticket-neon-night-poster/800/1100",
    bannerUrl: "https://picsum.photos/seed/lilticket-neon-night-banner/1600/700",
    categoryName: "Music Concert",
    description: "Konser malam dengan konsep visual neon dan lineup musisi populer.",
    endAt: "2026-08-15T16:30:00.000Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    startAt: "2026-08-15T12:00:00.000Z",
    status: "PUBLISHED",
    title: "Neon Night Live 2026",
    venueName: "Istora Senayan",
  },
  {
    posterUrl: "https://picsum.photos/seed/lilticket-summer-sound-poster/800/1100",
    bannerUrl: "https://picsum.photos/seed/lilticket-summer-sound-banner/1600/700",
    categoryName: "Festival",
    description: "Festival musik outdoor dengan tenant makanan dan beberapa panggung.",
    endAt: "2026-09-05T17:00:00.000Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    startAt: "2026-09-05T06:00:00.000Z",
    status: "PUBLISHED",
    title: "Summer Sound Fest",
    venueName: "Gelora Bung Karno Main Stadium",
  },
  {
    posterUrl: "https://picsum.photos/seed/lilticket-jazz-atrium-poster/800/1100",
    bannerUrl: "https://picsum.photos/seed/lilticket-jazz-atrium-banner/1600/700",
    categoryName: "Music Concert",
    description: "Pertunjukan jazz intimate dengan format seated concert.",
    endAt: "2026-07-20T15:30:00.000Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    startAt: "2026-07-20T11:30:00.000Z",
    status: "PUBLISHED",
    title: "Jazz Atrium Bandung",
    venueName: "Trans Convention Centre Bandung",
  },
  {
    posterUrl: "https://picsum.photos/seed/lilticket-culture-wave-poster/800/1100",
    bannerUrl: "https://picsum.photos/seed/lilticket-culture-wave-banner/1600/700",
    categoryName: "Arts & Culture",
    description: "Pentas budaya modern yang menggabungkan tari, musik, dan multimedia.",
    endAt: "2026-10-12T15:00:00.000Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    startAt: "2026-10-12T10:00:00.000Z",
    status: "PUBLISHED",
    title: "Culture Wave Surabaya",
    venueName: "Dyandra Convention Center Surabaya",
  },
  {
    posterUrl: "https://picsum.photos/seed/lilticket-digital-stage-poster/800/1100",
    bannerUrl: "https://picsum.photos/seed/lilticket-digital-stage-banner/1600/700",
    categoryName: "Conference",
    description: "Konferensi teknologi untuk kreator event, promotor, dan pelaku industri hiburan.",
    endAt: "2026-11-02T10:00:00.000Z",
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    startAt: "2026-11-02T02:00:00.000Z",
    status: "PUBLISHED",
    title: "Digital Stage Summit",
    venueName: "Istora Senayan",
  },
];

const ticketTypeTemplates = [
  {
    name: "Regular",
    price: 250000,
    quota: 500,
  },
  {
    name: "VIP",
    price: 750000,
    quota: 150,
  },
  {
    name: "VVIP",
    price: 1500000,
    quota: 50,
  },
];

async function seedUsers(client) {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    await client.query(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          updated_at = NOW()
      `,
      [user.fullName, user.email, passwordHash, user.role],
    );
  }
}

async function seedCategories(client) {
  const categoryMap = new Map();

  for (const category of categories) {
    const result = await client.query(
      `
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING id, name
      `,
      [category.name, category.description],
    );

    categoryMap.set(result.rows[0].name, result.rows[0].id);
  }

  return categoryMap;
}

async function seedVenues(client) {
  const venueMap = new Map();

  for (const venue of venues) {
    const result = await client.query(
      `
        INSERT INTO venues (id, name, address, city, province, capacity)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          province = EXCLUDED.province,
          capacity = EXCLUDED.capacity,
          updated_at = NOW()
        RETURNING id, name
      `,
      [venue.id, venue.name, venue.address, venue.city, venue.province, venue.capacity],
    );

    venueMap.set(result.rows[0].name, result.rows[0].id);
  }

  return venueMap;
}

async function seedEvents(client, categoryMap, venueMap) {
  const eventMap = new Map();

  for (const event of events) {
    const categoryId = categoryMap.get(event.categoryName);
    const venueId = venueMap.get(event.venueName);

    const result = await client.query(
      `
        INSERT INTO events (
          id,
          category_id,
          venue_id,
          title,
          description,
          poster_url,
          banner_url,
          start_at,
          end_at,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id)
        DO UPDATE SET
          category_id = EXCLUDED.category_id,
          venue_id = EXCLUDED.venue_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          poster_url = EXCLUDED.poster_url,
          banner_url = EXCLUDED.banner_url,
          start_at = EXCLUDED.start_at,
          end_at = EXCLUDED.end_at,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING id, title
      `,
      [
        event.id,
        categoryId,
        venueId,
        event.title,
        event.description,
        event.posterUrl,
        event.bannerUrl,
        event.startAt,
        event.endAt,
        event.status,
      ],
    );

    eventMap.set(result.rows[0].title, result.rows[0].id);
  }

  return eventMap;
}

async function seedTicketTypes(client, eventMap) {
  let eventIndex = 1;

  for (const event of events) {
    const eventId = eventMap.get(event.title);
    let ticketTypeIndex = 1;

    for (const ticketType of ticketTypeTemplates) {
      const ticketTypeId = `bbbbbbbb-bbbb-4bbb-8bbb-${String(eventIndex).padStart(6, "0")}${String(ticketTypeIndex).padStart(6, "0")}`;

      await client.query(
        `
          INSERT INTO ticket_types (id, event_id, name, description, price, quota)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id)
          DO UPDATE SET
            event_id = EXCLUDED.event_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            quota = EXCLUDED.quota,
            updated_at = NOW()
        `,
        [
          ticketTypeId,
          eventId,
          ticketType.name,
          `${ticketType.name} ticket for ${event.title}`,
          ticketType.price,
          ticketType.quota,
        ],
      );

      ticketTypeIndex += 1;
    }

    eventIndex += 1;
  }
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("Starting LilTicket seed...");

    await client.query("BEGIN");

    await seedUsers(client);
    const categoryMap = await seedCategories(client);
    const venueMap = await seedVenues(client);
    const eventMap = await seedEvents(client, categoryMap, venueMap);
    await seedTicketTypes(client, eventMap);

    await client.query("COMMIT");

    console.log("LilTicket seed completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("LilTicket seed failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
