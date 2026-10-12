/**
 * Demo data for Aisha's Salon.
 *
 *   npm run seed            add demo data if the database is empty
 *   npm run seed -- --fresh wipe every collection first, then seed
 *
 * Creates the admin account, salon settings, catalogue, stylists, customers,
 * four months of booking / payment history (so the dashboard charts have
 * something to show), reviews, gallery images and inventory.
 */
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const models = require('../models');
const { generateReference } = require('../utils/helpers');
const { nowInZone, addDays, weekdayOf, zonedToUtc, minutesToTime } = require('../utils/time');

const {
  User, Setting, Category, Service, Employee, Appointment, BookedSlot, Payment, Review,
  GalleryItem, Supplier, InventoryItem, StockTransaction, Notification,
} = models;

const CUSTOMER_PASSWORD = 'Customer@123';
const photo = (id, width = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

// Deterministic pseudo-random numbers so every seed run produces the same data.
let randomState = 20261012;
const random = () => {
  randomState = (randomState * 1664525 + 1013904223) % 4294967296;
  return randomState / 4294967296;
};
const pickOne = (list) => list[Math.floor(random() * list.length)];

// Every photo below was checked by eye to make sure it shows what its key says.
const IMAGES = {
  hair: photo('1522337360788-8b13dee7a37e'),
  hairWash: photo('1595476108010-b4d1f102b1b1'),
  hairStyle: photo('1562322140-8baeececf3df'),
  hairColor: photo('1492106087820-71f1a00d2b11'),
  hairTools: photo('1527799820374-dcf8d9d4a388'),
  updo: photo('1582095133179-bfd08e2fc6b3'),
  naturalHair: photo('1519699047748-de8e457a634e'),
  facial: photo('1570172619644-dfd03ed5d881'),
  serum: photo('1515377905703-c4788e51af15'),
  spa: photo('1544161515-4ab6ce6db874'),
  spaProducts: photo('1540555700478-4be289fbecef'),
  makeup: photo('1487412947147-5cebf100ffc2'),
  makeupKit: photo('1522335789203-aabd1fc54bc9'),
  makeupPalette: photo('1512496015851-a90fb38ba796'),
  makeupFlatlay: photo('1596462502278-27bfdc403348'),
  nailArt: photo('1604654894610-df63bc536371'),
  manicure: photo('1610992015732-2449b76344bc'),
  pedicure: photo('1519415510236-718bdfcd89c8'),
};

// Stylists without a photo fall back to an initials avatar in the UI.
const PORTRAITS = [
  photo('1531123897727-8f129e1688ce', 500),
  photo('1519699047748-de8e457a634e', 500),
  '',
  photo('1589156280159-27698a70f29e', 500),
  '',
];

const CATEGORIES = [
  { name: 'Hair', description: 'Cuts, styling, colouring and treatments for every hair type.', image: IMAGES.hair },
  { name: 'Braids', description: 'Protective styles, from classic cornrows to knotless braids.', image: IMAGES.updo },
  { name: 'Facials', description: 'Skin treatments that cleanse, restore and brighten.', image: IMAGES.facial },
  { name: 'Spa', description: 'Massage and body therapies to help you unwind.', image: IMAGES.spa },
  { name: 'Makeup', description: 'Flawless looks for weddings, shoots and nights out.', image: IMAGES.makeup },
  { name: 'Nails', description: 'Manicures and pedicures with a lasting finish.', image: IMAGES.nailArt },
];

const SERVICES = [
  ['Hair', 'Wash & Blow Dry', 'Deep cleansing wash, conditioning treatment and a smooth professional blow dry.', 6000, 45, IMAGES.hairWash, true],
  ['Hair', 'Silk Press', 'Heat styling for natural hair that leaves it sleek, shiny and full of movement.', 15000, 90, IMAGES.hairStyle, true],
  ['Hair', 'Hair Colouring', 'Full head colour using premium, ammonia-free products matched to your skin tone.', 25000, 120, IMAGES.hairColor, false],
  ['Hair', 'Wig Installation', 'Seamless frontal or closure install, customised and styled to suit your face.', 18000, 90, IMAGES.hair, false],
  ['Braids', 'Knotless Braids', 'Lightweight, tension-free box braids for a natural look that lasts for weeks.', 22000, 240, IMAGES.updo, true],
  ['Braids', 'Ghana Weaving', 'Neat, elegant cornrows in the pattern of your choice.', 12000, 150, IMAGES.naturalHair, false],
  ['Braids', 'Faux Locs', 'Soft, natural-looking locs installed with care for your edges.', 28000, 300, IMAGES.hairTools, false],
  ['Facials', 'Classic Facial', 'Cleanse, exfoliate, steam, extraction and mask for fresh, glowing skin.', 12000, 60, IMAGES.facial, true],
  ['Facials', 'Brightening Facial', 'Vitamin C treatment that evens skin tone and restores radiance.', 18000, 75, IMAGES.serum, false],
  ['Spa', 'Swedish Massage', 'A full-body relaxing massage that eases tension and improves circulation.', 20000, 60, IMAGES.spa, true],
  ['Spa', 'Aromatherapy Massage', 'Warm essential oils and slow, soothing strokes that melt away stress.', 28000, 90, IMAGES.spaProducts, false],
  ['Makeup', 'Bridal Makeup', 'Long-wear bridal glam, including a consultation and lashes.', 60000, 120, IMAGES.makeup, true],
  ['Makeup', 'Soft Glam Makeup', 'A polished everyday or evening look, with lashes included.', 20000, 60, IMAGES.makeupFlatlay, false],
  ['Nails', 'Classic Pedicure', 'Foot soak, scrub, nail care, massage and polish.', 8000, 45, IMAGES.pedicure, true],
  ['Nails', 'Gel Manicure', 'Nail shaping, cuticle care and chip-resistant gel polish.', 9000, 45, IMAGES.manicure, false],
];

const EMPLOYEES = [
  { name: 'Halima Yusuf', specialization: 'Hair Stylist & Colourist', experienceYears: 9, categories: ['Hair'], off: [0, 1],
    bio: 'Halima is known for healthy silk presses and colour work that flatters every skin tone.' },
  { name: 'Ngozi Okafor', specialization: 'Braiding Specialist', experienceYears: 12, categories: ['Braids', 'Hair'], off: [0],
    bio: 'With over a decade of braiding experience, Ngozi creates neat, long-lasting protective styles.' },
  { name: 'Zainab Bello', specialization: 'Skin Therapist', experienceYears: 6, categories: ['Facials', 'Spa'], off: [0, 3],
    bio: 'Zainab is a certified aesthetician who builds treatments around your skin type.' },
  { name: 'Funke Adeyemi', specialization: 'Makeup Artist', experienceYears: 8, categories: ['Makeup'], off: [0, 2],
    bio: 'Funke has prepared more than 300 brides and specialises in soft, camera-ready glam.' },
  { name: 'Blessing Eze', specialization: 'Nail Technician & Massage Therapist', experienceYears: 5, categories: ['Nails', 'Spa'], off: [0],
    bio: 'Blessing pairs meticulous nail work with a deeply relaxing massage technique.' },
];

const CUSTOMERS = [
  ['Aisha Sule', 'aisha@example.com', '08031234501'],
  ['Chioma Nwosu', 'chioma@example.com', '08031234502'],
  ['Fatima Abubakar', 'fatima@example.com', '08031234503'],
  ['Tolu Bakare', 'tolu@example.com', '08031234504'],
  ['Hauwa Ibrahim', 'hauwa@example.com', '08031234505'],
  ['Ifeoma Obi', 'ifeoma@example.com', '08031234506'],
  ['Maryam Garba', 'maryam@example.com', '08031234507'],
  ['Kemi Ojo', 'kemi@example.com', '08031234508'],
  ['Rukayya Musa', 'rukayya@example.com', '08031234509'],
  ['Adaeze Uche', 'adaeze@example.com', '08031234510'],
];

const REVIEW_COMMENTS = [
  [5, 'Absolutely loved my experience. The salon is spotless and the staff are so welcoming.'],
  [5, 'Best service I have had in a long time. Booking online was quick and I was attended to right on time.'],
  [4, 'Great result and very professional. I will definitely be coming back.'],
  [5, 'My stylist listened to exactly what I wanted and delivered. Highly recommended!'],
  [4, 'Lovely atmosphere and a very relaxing session. Worth every naira.'],
  [5, 'I have received so many compliments since my visit. Thank you, Aisha\'s Salon!'],
  [3, 'Good service overall, though I waited a few minutes past my appointment time.'],
  [5, 'Gentle hands and beautiful work. The online receipt was a nice touch too.'],
];

const GALLERY = [
  ['Hair', 'Blow dry and styling', IMAGES.hairStyle], ['Hair', 'Pastel colour', IMAGES.hairColor], ['Hair', 'Soft waves', IMAGES.hair],
  ['Braids', 'Twisted updo', IMAGES.updo], ['Braids', 'Natural hair care', IMAGES.naturalHair],
  ['Facials', 'Clay mask facial', IMAGES.facial], ['Facials', 'Serum treatment', IMAGES.serum],
  ['Spa', 'Massage therapy', IMAGES.spa], ['Spa', 'Spa essentials', IMAGES.spaProducts],
  ['Makeup', 'Soft glam', IMAGES.makeup], ['Makeup', 'Artist palette', IMAGES.makeupPalette], ['Makeup', 'Everyday essentials', IMAGES.makeupFlatlay],
  ['Pedicure', 'Classic pedicure', IMAGES.pedicure], ['Pedicure', 'Nail art', IMAGES.nailArt], ['Pedicure', 'Natural manicure', IMAGES.manicure],
];

const wipeDatabase = () => Promise.all(Object.values(models).map((Model) => Model.deleteMany({})));

const seedDatabase = async ({ fresh = false, log = true } = {}) => {
  const say = (message) => { if (log) console.log(`[seed] ${message}`); };

  if (fresh) {
    await wipeDatabase();
    say('Existing data removed');
  } else if (await Service.exists({})) {
    say('Database already contains data. Use "npm run seed -- --fresh" to reset it.');
    return false;
  }

  /* ----------------------------- Settings + users ---------------------------- */
  await Setting.findOneAndUpdate({ key: 'main' }, {
    businessName: "Aisha's Salon",
    tagline: 'Where beauty meets luxury',
    about: "Aisha's Salon is a full-service beauty destination offering hair, braiding, skincare, spa, makeup and nail services delivered by experienced professionals in a calm, luxurious space.",
    address: '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
    email: 'hello@aishasalon.com',
    phone: '+234 803 123 4567',
    socialLinks: {
      facebook: 'https://facebook.com/aishasalon',
      instagram: 'https://instagram.com/aishasalon',
      twitter: 'https://x.com/aishasalon',
      tiktok: 'https://tiktok.com/@aishasalon',
      whatsapp: 'https://wa.me/2348031234567',
    },
  }, { upsert: true, setDefaultsOnInsert: true });
  const settings = await Setting.getMain();
  const { timezone } = settings;
  const { date: today, minutes: nowMinutes } = nowInZone(timezone);

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: env.admin.name, email: env.admin.email, password: env.admin.password, role: 'admin', phone: '+234 803 123 4567',
    });
  }

  // Hash once and insert directly: much faster than hashing per customer.
  const passwordHash = await bcrypt.hash(CUSTOMER_PASSWORD, 12);
  const customers = await User.insertMany(CUSTOMERS.map(([name, email, phone], index) => ({
    name, email, phone, password: passwordHash, role: 'customer',
    createdAt: zonedToUtc(addDays(today, -(330 - index * 31)), '10:00', timezone),
  })), { timestamps: false });
  say(`${customers.length} customers (password: ${CUSTOMER_PASSWORD})`);

  /* -------------------------------- Catalogue -------------------------------- */
  const categories = await Category.create(CATEGORIES);
  const categoryId = (name) => categories.find((category) => category.name === name)._id;

  const services = await Service.create(SERVICES.map(([category, name, description, price, duration, image, isFeatured]) => ({
    category: categoryId(category), name, description, price, duration, image, isFeatured,
  })));
  say(`${categories.length} categories, ${services.length} services`);

  const employees = await Employee.create(EMPLOYEES.map((employee, index) => ({
    name: employee.name,
    email: `${employee.name.split(' ')[0].toLowerCase()}@aishasalon.com`,
    phone: `0802000000${index + 1}`,
    photo: PORTRAITS[index],
    bio: employee.bio,
    specialization: employee.specialization,
    experienceYears: employee.experienceYears,
    services: services
      .filter((service) => employee.categories.some((name) => categoryId(name).equals(service.category)))
      .map((service) => service._id),
    workingHours: Array.from({ length: 7 }, (_, day) => ({
      day, isWorking: !employee.off.includes(day), start: '09:00', end: day === 6 ? '17:00' : '18:00',
    })),
  })));
  say(`${employees.length} employees`);

  /* --------------------------- Bookings and payments -------------------------- */
  const appointments = [];
  const payments = [];
  const bookedSlots = [];

  const addAppointment = ({ date, startMinutes, employee, service, status, paid, method }) => {
    const customer = pickOne(customers);
    const startTime = minutesToTime(startMinutes);
    const endTime = minutesToTime(startMinutes + service.duration);
    const startAt = zonedToUtc(date, startTime, timezone);
    const createdAt = new Date(startAt.getTime() - (1 + Math.floor(random() * 5)) * 24 * 60 * 60 * 1000);
    const appointment = new Appointment({
      reference: generateReference('APT'),
      customer: customer._id, service: service._id, employee: employee._id,
      date, startTime, endTime, startAt, endAt: zonedToUtc(date, endTime, timezone),
      duration: service.duration, price: service.price, status,
      paymentMethod: method, paymentStatus: paid ? 'paid' : 'unpaid',
      cancelReason: status === 'cancelled' ? 'Change of plans' : undefined,
      createdAt, updatedAt: createdAt,
    });
    appointments.push(appointment);
    payments.push({
      reference: generateReference('PAY'),
      appointment: appointment._id, customer: customer._id, amount: service.price, currency: settings.currency,
      method, status: paid ? 'success' : (['cancelled', 'no_show'].includes(status) ? 'cancelled' : 'pending'),
      paidAt: paid ? new Date(startAt.getTime() + service.duration * 60 * 1000) : undefined,
      receiptNumber: paid ? generateReference('RCP') : undefined,
      recordedBy: paid ? admin._id : undefined,
      createdAt, updatedAt: createdAt,
    });
    if (['pending', 'confirmed'].includes(status)) {
      for (let block = startMinutes; block < startMinutes + service.duration; block += BookedSlot.BLOCK_MINUTES) {
        bookedSlots.push({ appointment: appointment._id, employee: employee._id, date, block });
      }
    }
    return appointment;
  };

  // History (120 days back) and upcoming bookings (10 days ahead).
  for (let offset = -120; offset <= 10; offset += 1) {
    const date = addDays(today, offset);
    const weekday = weekdayOf(date);
    for (const employee of employees) {
      const hours = employee.workingHours.find((h) => h.day === weekday);
      if (!hours.isWorking) continue;
      const closing = weekday === 6 ? 17 * 60 : 18 * 60;
      const offered = services.filter((service) => employee.services.some((id) => id.equals(service._id)));

      let cursor = 9 * 60 + Math.floor(random() * 3) * 30;
      // Busier in recent weeks, so the revenue chart trends upwards.
      const bookingChance = offset > 0 ? 0.45 : 0.5 + (120 + offset) / 400;
      while (cursor < closing) {
        const service = pickOne(offered);
        if (cursor + service.duration > closing) break;
        if (random() < bookingChance) {
          const roll = random();
          let status = 'completed';
          if (offset > 0) status = roll < 0.6 ? 'confirmed' : 'pending';
          else if (offset === 0) status = cursor + service.duration <= nowMinutes ? 'completed' : 'confirmed';
          else if (roll < 0.08) status = 'cancelled';
          else if (roll < 0.11) status = 'no_show';
          addAppointment({
            date, startMinutes: cursor, employee, service, status,
            paid: status === 'completed',
            method: pickOne(['cash', 'cash', 'pos', 'bank_transfer']),
          });
        }
        cursor += service.duration + 30 + Math.floor(random() * 3) * 30;
      }
    }
  }

  await Appointment.insertMany(appointments, { timestamps: false });
  await Payment.insertMany(payments, { timestamps: false });
  await BookedSlot.insertMany(bookedSlots);
  say(`${appointments.length} appointments with payments`);

  /* ---------------------------------- Reviews --------------------------------- */
  const completed = appointments.filter((appointment) => appointment.status === 'completed');
  const reviews = completed.filter((_, index) => index % 9 === 0).slice(-40).map((appointment, index) => {
    const [rating, comment] = REVIEW_COMMENTS[index % REVIEW_COMMENTS.length];
    return {
      customer: appointment.customer, appointment: appointment._id,
      service: appointment.service, employee: appointment.employee,
      rating, comment, isApproved: index % 10 !== 9, // leave a few awaiting moderation
      createdAt: new Date(appointment.endAt.getTime() + 24 * 60 * 60 * 1000),
    };
  });
  await Review.insertMany(reviews, { timestamps: false });
  await Promise.all(employees.map((employee) => Review.refreshEmployeeRating(employee._id)));
  say(`${reviews.length} reviews`);

  /* ---------------------------------- Gallery --------------------------------- */
  await GalleryItem.insertMany(GALLERY.map(([category, title, image]) => ({ category, title, image })));

  /* --------------------------------- Inventory -------------------------------- */
  const suppliers = await Supplier.create([
    { name: 'Glow Beauty Supplies', contactPerson: 'Mr. Emeka Obi', phone: '08055550101', email: 'sales@glowbeauty.ng', address: 'Balogun Market, Lagos Island' },
    { name: 'Royal Hair Imports', contactPerson: 'Mrs. Sade Cole', phone: '08055550102', email: 'orders@royalhair.ng', address: 'Trade Fair Complex, Ojo, Lagos' },
    { name: 'PureSkin Distributors', contactPerson: 'Miss Joy Etim', phone: '08055550103', email: 'hello@pureskin.ng', address: 'Allen Avenue, Ikeja, Lagos' },
  ]);
  const items = await InventoryItem.create([
    ['Moisturising Shampoo 1L', 'HAIR-SH-001', 'Hair Care', 0, 18, 6, 4500, 7500, 'bottles'],
    ['Deep Conditioner 1L', 'HAIR-CN-002', 'Hair Care', 0, 4, 6, 5200, 8500, 'bottles'],
    ['Braiding Hair Extensions', 'HAIR-EX-003', 'Hair Care', 1, 60, 20, 1200, 2500, 'packs'],
    ['Heat Protectant Spray', 'HAIR-HP-004', 'Hair Care', 1, 9, 5, 3800, 6500, 'bottles'],
    ['Gel Nail Polish Set', 'NAIL-GP-005', 'Nails', 0, 3, 5, 9000, 15000, 'sets'],
    ['Acetone Remover 500ml', 'NAIL-AC-006', 'Nails', 0, 14, 4, 1500, 3000, 'bottles'],
    ['Vitamin C Serum 30ml', 'SKIN-VC-007', 'Skin Care', 2, 22, 8, 6500, 12000, 'bottles'],
    ['Clay Face Mask 250g', 'SKIN-CM-008', 'Skin Care', 2, 7, 6, 4000, 7500, 'jars'],
    ['Massage Oil 500ml', 'SPA-MO-009', 'Spa', 2, 11, 4, 5500, 9500, 'bottles'],
    ['Disposable Towels (100)', 'GEN-DT-010', 'Consumables', 0, 2, 5, 3500, 0, 'packs'],
  ].map(([name, sku, category, supplierIndex, quantity, reorderLevel, costPrice, sellingPrice, unit]) => ({
    name, sku, category, supplier: suppliers[supplierIndex]._id, quantity, reorderLevel, costPrice, sellingPrice, unit,
  })));

  const stockTransactions = [];
  items.forEach((item, index) => {
    const purchased = item.quantity + 6;
    const purchasedAt = zonedToUtc(addDays(today, -(20 + index)), '11:00', timezone);
    stockTransactions.push({
      item: item._id, type: 'purchase', quantity: purchased, unitPrice: item.costPrice, total: purchased * item.costPrice,
      supplier: item.supplier, note: 'Monthly restock', balanceAfter: purchased, createdBy: admin._id,
      createdAt: purchasedAt, updatedAt: purchasedAt,
    });
    if (item.sellingPrice > 0) {
      const soldAt = zonedToUtc(addDays(today, -(3 + (index % 5))), '15:00', timezone);
      stockTransactions.push({
        item: item._id, type: 'sale', quantity: 6, unitPrice: item.sellingPrice, total: 6 * item.sellingPrice,
        note: 'Retail sale', balanceAfter: item.quantity, createdBy: admin._id, createdAt: soldAt, updatedAt: soldAt,
      });
    }
  });
  await StockTransaction.insertMany(stockTransactions, { timestamps: false });
  say(`${items.length} inventory products, ${suppliers.length} suppliers`);

  /* ------------------------------- Notifications ------------------------------ */
  const lowStock = items.filter((item) => item.quantity <= item.reorderLevel);
  await Notification.insertMany([
    { recipient: admin._id, type: 'system', title: 'Welcome to your dashboard', message: 'Demo data has been loaded so you can explore every feature.', link: '/admin' },
    ...lowStock.map((item) => ({
      recipient: admin._id, type: 'inventory', title: 'Low stock alert',
      message: `${item.name} is down to ${item.quantity} ${item.unit} (reorder level ${item.reorderLevel}).`, link: '/admin/inventory',
    })),
  ]);

  say(`Admin login: ${admin.email} / ${env.admin.password}`);
  return true;
};

module.exports = { seedDatabase, wipeDatabase, CUSTOMER_PASSWORD };

// Run directly from the command line.
if (require.main === module) {
  const { connectDatabase, disconnectDatabase } = require('../config/database');
  const { migrate } = require('./migrate');
  connectDatabase()
    .then(migrate)
    .then(() => seedDatabase({ fresh: process.argv.includes('--fresh') }))
    .then(() => console.log('[seed] Done'))
    .catch((error) => {
      console.error('[seed] Failed:', error);
      process.exitCode = 1;
    })
    .finally(disconnectDatabase);
}
