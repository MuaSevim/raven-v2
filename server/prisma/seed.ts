import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create pg Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma client with pg adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Sample avatar URLs (using UI Avatars service)
const getAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;

// Test users data
const users = [
  {
    id: 'test-user-001',
    email: 'emma.johnson@example.com',
    firstName: 'Emma',
    lastName: 'Johnson',
    birthDay: 15,
    birthMonth: 3,
    birthYear: 1992,
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    role: 'SENDER',
    isVerified: true,
  },
  {
    id: 'test-user-002',
    email: 'marcus.chen@example.com',
    firstName: 'Marcus',
    lastName: 'Chen',
    birthDay: 22,
    birthMonth: 7,
    birthYear: 1988,
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    role: 'COURIER',
    isVerified: true,
  },
  {
    id: 'test-user-003',
    email: 'sofia.martinez@example.com',
    firstName: 'Sofia',
    lastName: 'Martinez',
    birthDay: 8,
    birthMonth: 11,
    birthYear: 1995,
    country: 'Spain',
    countryCode: 'ES',
    city: 'Barcelona',
    role: 'SENDER',
    isVerified: true,
  },
  {
    id: 'test-user-004',
    email: 'lars.andersson@example.com',
    firstName: 'Lars',
    lastName: 'Andersson',
    birthDay: 30,
    birthMonth: 1,
    birthYear: 1990,
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Stockholm',
    role: 'COURIER',
    isVerified: true,
  },
  {
    id: 'test-user-005',
    email: 'yuki.tanaka@example.com',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    birthDay: 12,
    birthMonth: 5,
    birthYear: 1993,
    country: 'Japan',
    countryCode: 'JP',
    city: 'Tokyo',
    role: 'SENDER',
    isVerified: false,
  },
  {
    id: 'test-user-006',
    email: 'oliver.mueller@example.com',
    firstName: 'Oliver',
    lastName: 'Müller',
    birthDay: 5,
    birthMonth: 9,
    birthYear: 1987,
    country: 'Germany',
    countryCode: 'DE',
    city: 'Berlin',
    role: 'COURIER',
    isVerified: true,
  },
  {
    id: 'test-user-007',
    email: 'chloe.dubois@example.com',
    firstName: 'Chloé',
    lastName: 'Dubois',
    birthDay: 18,
    birthMonth: 4,
    birthYear: 1994,
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    role: 'SENDER',
    isVerified: true,
  },
  {
    id: 'test-user-008',
    email: 'ahmed.hassan@example.com',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    birthDay: 25,
    birthMonth: 12,
    birthYear: 1991,
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    role: 'COURIER',
    isVerified: true,
  },
  {
    id: 'test-user-009',
    email: 'maria.silva@example.com',
    firstName: 'Maria',
    lastName: 'Silva',
    birthDay: 3,
    birthMonth: 8,
    birthYear: 1996,
    country: 'Brazil',
    countryCode: 'BR',
    city: 'São Paulo',
    role: 'SENDER',
    isVerified: false,
  },
  {
    id: 'test-user-010',
    email: 'james.wilson@example.com',
    firstName: 'James',
    lastName: 'Wilson',
    birthDay: 14,
    birthMonth: 2,
    birthYear: 1985,
    country: 'Australia',
    countryCode: 'AU',
    city: 'Sydney',
    role: 'COURIER',
    isVerified: true,
  },
];

// Shipment content ideas
const packageContents = [
  'Electronics - Laptop and accessories',
  'Birthday gift for my mom',
  'Vintage vinyl records collection',
  'Handmade jewelry pieces',
  'Important documents and contracts',
  'Designer clothing items',
  'Artisanal coffee beans',
  'Camera equipment',
  'Books and rare manuscripts',
  'Traditional crafts and souvenirs',
  'Medical supplies',
  'Sports equipment',
  'Cosmetics and skincare products',
  'Watch collection',
  'Children\'s toys and games',
];

// Meeting points
const meetingPoints = [
  { address: 'Central Station Main Entrance', lat: 40.7527, lng: -73.9772 },
  { address: 'Airport Terminal 2 Arrivals', lat: 51.4700, lng: -0.4543 },
  { address: 'City Center Mall Food Court', lat: 41.3851, lng: 2.1734 },
  { address: 'Hotel Lobby - Grand Hyatt', lat: 59.3293, lng: 18.0686 },
  { address: 'Coffee shop near Times Square', lat: 40.7580, lng: -73.9855 },
  { address: 'Train Station Platform 1', lat: 48.8566, lng: 2.3522 },
  { address: 'Shopping Mall Entrance', lat: 35.6762, lng: 139.6503 },
  { address: 'University Campus Gate', lat: 52.5200, lng: 13.4050 },
];

// Routes for shipments
const routes = [
  { originCountry: 'United States', originCity: 'New York', destCountry: 'United Kingdom', destCity: 'London', destAirport: 'Heathrow Airport', destAirportCode: 'LHR' },
  { originCountry: 'Sweden', originCity: 'Stockholm', destCountry: 'Spain', destCity: 'Barcelona', destAirport: 'Barcelona-El Prat', destAirportCode: 'BCN' },
  { originCountry: 'Germany', originCity: 'Berlin', destCountry: 'Japan', destCity: 'Tokyo', destAirport: 'Narita International', destAirportCode: 'NRT' },
  { originCountry: 'France', originCity: 'Paris', destCountry: 'United States', destCity: 'Los Angeles', destAirport: 'Los Angeles International', destAirportCode: 'LAX' },
  { originCountry: 'Australia', originCity: 'Sydney', destCountry: 'United Arab Emirates', destCity: 'Dubai', destAirport: 'Dubai International', destAirportCode: 'DXB' },
  { originCountry: 'Brazil', originCity: 'São Paulo', destCountry: 'Portugal', destCity: 'Lisbon', destAirport: 'Lisbon Portela', destAirportCode: 'LIS' },
  { originCountry: 'Japan', originCity: 'Tokyo', destCountry: 'South Korea', destCity: 'Seoul', destAirport: 'Incheon International', destAirportCode: 'ICN' },
  { originCountry: 'United Kingdom', originCity: 'London', destCountry: 'Italy', destCity: 'Rome', destAirport: 'Leonardo da Vinci', destAirportCode: 'FCO' },
  { originCountry: 'Spain', originCity: 'Madrid', destCountry: 'Mexico', destCity: 'Mexico City', destAirport: 'Benito Juárez International', destAirportCode: 'MEX' },
  { originCountry: 'Canada', originCity: 'Toronto', destCountry: 'Germany', destCity: 'Munich', destAirport: 'Munich Airport', destAirportCode: 'MUC' },
  { originCountry: 'Netherlands', originCity: 'Amsterdam', destCountry: 'Thailand', destCity: 'Bangkok', destAirport: 'Suvarnabhumi Airport', destAirportCode: 'BKK' },
  { originCountry: 'Singapore', originCity: 'Singapore', destCountry: 'Australia', destCity: 'Melbourne', destAirport: 'Melbourne Airport', destAirportCode: 'MEL' },
];

// Generate random date in the future
function futureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

// Random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.shipmentOffer.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.travel.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create users
  console.log('👥 Creating users...');
  for (const userData of users) {
    await prisma.user.create({
      data: {
        ...userData,
        avatar: getAvatar(`${userData.firstName} ${userData.lastName}`),
      },
    });
    console.log(`   ✓ Created user: ${userData.firstName} ${userData.lastName}`);
  }
  console.log(`✅ Created ${users.length} users\n`);

  // Create shipments
  console.log('📦 Creating shipments...');
  const senderUsers = users.filter(u => u.role === 'SENDER');
  const shipments: any[] = [];

  for (let i = 0; i < 20; i++) {
    const sender = randomFrom(senderUsers);
    const route = randomFrom(routes);
    const startDays = randomBetween(3, 30);
    const endDays = startDays + randomBetween(3, 14);

    const statuses = ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const currencies = ['USD', 'EUR', 'GBP', 'SEK'];

    const shipment = await prisma.shipment.create({
      data: {
        originCountry: route.originCountry,
        originCity: route.originCity,
        destCountry: route.destCountry,
        destCity: route.destCity,
        weight: randomBetween(1, 15) + randomBetween(0, 9) / 10,
        weightUnit: 'kg',
        content: randomFrom(packageContents),
        packageType: randomFrom(['Package', 'Document', 'Box', 'Envelope']),
        dateStart: futureDate(startDays),
        dateEnd: futureDate(endDays),
        price: randomBetween(30, 200),
        currency: randomFrom(currencies),
        status: randomFrom(statuses),
        senderFullName: `${sender.firstName} ${sender.lastName}`,
        senderPhone: `${randomBetween(100, 999)}${randomBetween(1000000, 9999999)}`,
        senderPhoneCode: '+1',
        senderId: sender.id,
      },
    });

    shipments.push(shipment);
    console.log(`   ✓ Shipment: ${route.originCity} → ${route.destCity} (${shipment.status})`);
  }
  console.log(`✅ Created ${shipments.length} shipments\n`);

  // Create offers for some shipments
  console.log('💬 Creating offers...');
  const courierUsers = users.filter(u => u.role === 'COURIER');
  const openShipments = shipments.filter(s => s.status === 'OPEN' || s.status === 'MATCHED');
  let offerCount = 0;

  const offerMessages = [
    "Hi! I'm traveling on this route and would be happy to deliver your package.",
    "I can deliver this for you! I travel this route frequently for work.",
    "Hello! I have space in my luggage and I'm flying there next week.",
    "I'd love to help! I'm a verified traveler with great reviews.",
    "Perfect timing! I'm already booked on a flight to this destination.",
    "I can pick this up on my way. Very reliable courier here!",
    "This works great with my travel plans. Let me know!",
  ];

  for (const shipment of openShipments) {
    // Each open shipment gets 1-3 offers
    const numOffers = randomBetween(1, 3);
    const offeringCouriers = [...courierUsers].sort(() => Math.random() - 0.5).slice(0, numOffers);

    for (const courier of offeringCouriers) {
      const offerStatuses = shipment.status === 'MATCHED'
        ? ['ACCEPTED', 'REJECTED', 'REJECTED']
        : ['PENDING', 'PENDING', 'PENDING'];

      await prisma.shipmentOffer.create({
        data: {
          message: randomFrom(offerMessages),
          status: randomFrom(offerStatuses),
          shipmentId: shipment.id,
          courierId: courier.id,
        },
      });
      offerCount++;
    }
  }
  console.log(`✅ Created ${offerCount} offers\n`);

  // Create travels (trips posted by couriers)
  console.log('✈️  Creating travels...');
  let travelCount = 0;

  const travelRoutes = [
    { fromCountry: 'Sweden', fromCity: 'Stockholm', fromAirport: 'Arlanda Airport', fromAirportCode: 'ARN', toCountry: 'Turkey', toCity: 'Istanbul', toAirport: 'Istanbul Airport', toAirportCode: 'IST' },
    { fromCountry: 'United Kingdom', fromCity: 'London', fromAirport: 'Heathrow Airport', fromAirportCode: 'LHR', toCountry: 'United States', toCity: 'New York', toAirport: 'JFK International', toAirportCode: 'JFK' },
    { fromCountry: 'Germany', fromCity: 'Berlin', fromAirport: 'Berlin Brandenburg', fromAirportCode: 'BER', toCountry: 'Spain', toCity: 'Barcelona', toAirport: 'Barcelona-El Prat', toAirportCode: 'BCN' },
    { fromCountry: 'France', fromCity: 'Paris', fromAirport: 'Charles de Gaulle', fromAirportCode: 'CDG', toCountry: 'Japan', toCity: 'Tokyo', toAirport: 'Narita International', toAirportCode: 'NRT' },
    { fromCountry: 'United Arab Emirates', fromCity: 'Dubai', fromAirport: 'Dubai International', fromAirportCode: 'DXB', toCountry: 'Australia', toCity: 'Sydney', toAirport: 'Sydney Airport', toAirportCode: 'SYD' },
    { fromCountry: 'Australia', fromCity: 'Sydney', fromAirport: 'Sydney Airport', fromAirportCode: 'SYD', toCountry: 'Singapore', toCity: 'Singapore', toAirport: 'Changi Airport', toAirportCode: 'SIN' },
    { fromCountry: 'United States', fromCity: 'Los Angeles', fromAirport: 'LAX', fromAirportCode: 'LAX', toCountry: 'Mexico', toCity: 'Mexico City', toAirport: 'Benito Juárez', toAirportCode: 'MEX' },
    { fromCountry: 'Netherlands', fromCity: 'Amsterdam', fromAirport: 'Schiphol', fromAirportCode: 'AMS', toCountry: 'Thailand', toCity: 'Bangkok', toAirport: 'Suvarnabhumi', toAirportCode: 'BKK' },
    { fromCountry: 'Italy', fromCity: 'Rome', fromAirport: 'Fiumicino', fromAirportCode: 'FCO', toCountry: 'Brazil', toCity: 'São Paulo', toAirport: 'Guarulhos', toAirportCode: 'GRU' },
    { fromCountry: 'South Korea', fromCity: 'Seoul', fromAirport: 'Incheon', fromAirportCode: 'ICN', toCountry: 'Vietnam', toCity: 'Ho Chi Minh', toAirport: 'Tan Son Nhat', toAirportCode: 'SGN' },
  ];

  for (const courier of courierUsers) {
    // Each courier posts 1-3 upcoming trips
    const numTrips = randomBetween(1, 3);
    const selectedRoutes = [...travelRoutes].sort(() => Math.random() - 0.5).slice(0, numTrips);

    for (const route of selectedRoutes) {
      const departureDays = randomBetween(5, 45);
      const flightNumbers = ['BA123', 'LH456', 'AF789', 'EK321', 'QF654', 'SQ987', 'AA111', 'DL222'];

      await prisma.travel.create({
        data: {
          fromCountry: route.fromCountry,
          fromCity: route.fromCity,
          fromAirport: route.fromAirport,
          fromAirportCode: route.fromAirportCode,
          toCountry: route.toCountry,
          toCity: route.toCity,
          toAirport: route.toAirport,
          toAirportCode: route.toAirportCode,
          departureDate: futureDate(departureDays),
          arrivalDate: futureDate(departureDays + 1),
          availableWeight: randomBetween(2, 10) + randomBetween(0, 9) / 10,
          weightUnit: 'kg',
          pricePerKg: randomBetween(5, 25),
          currency: randomFrom(['USD', 'EUR', 'GBP']),
          flightNumber: randomFrom(flightNumbers),
          status: 'ACTIVE',
          travelerId: courier.id,
        },
      });
      travelCount++;
      console.log(`   ✓ Travel: ${route.fromCity} → ${route.toCity}`);
    }
  }
  console.log(`✅ Created ${travelCount} travels\n`);

  // Summary
  console.log('═'.repeat(50));
  console.log('🎉 Database seeded successfully!');
  console.log('═'.repeat(50));
  console.log(`   👥 Users:     ${users.length}`);
  console.log(`   📦 Shipments: ${shipments.length}`);
  console.log(`   💬 Offers:    ${offerCount}`);
  console.log(`   ✈️  Travels:   ${travelCount}`);
  console.log('═'.repeat(50));

  // Print test credentials
  console.log('\n📋 Test User IDs (for Firebase):');
  users.forEach(u => {
    console.log(`   ${u.firstName} ${u.lastName}: ${u.id} (${u.role})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
