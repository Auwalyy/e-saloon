require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  try {
    // Admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    const adminId = uuidv4();
    await query(`
      INSERT INTO users (id, name, email, phone, password, role, email_verified)
      VALUES ($1, 'Aisha Admin', $2, '+2348012345678', $3, 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, [adminId, process.env.ADMIN_EMAIL || 'admin@aishasalon.com', hashedPassword]);

    // Categories
    const categories = [
      { name: 'Hair', description: 'All hair services' },
      { name: 'Braids', description: 'Braiding services' },
      { name: 'Facials', description: 'Facial treatments' },
      { name: 'Spa', description: 'Spa and relaxation' },
      { name: 'Makeup', description: 'Makeup services' },
      { name: 'Pedicure', description: 'Nail and foot care' },
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const res = await query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING RETURNING id
      `, [cat.name, cat.description]);
      if (res.rows[0]) categoryIds[cat.name] = res.rows[0].id;
    }

    // Fetch category IDs if already exist
    const catRes = await query('SELECT id, name FROM categories');
    catRes.rows.forEach(r => { categoryIds[r.name] = r.id; });

    // Services
    const services = [
      { category: 'Hair', name: 'Hair Wash & Blow Dry', description: 'Professional wash and blow dry', price: 3500, duration: 60 },
      { category: 'Hair', name: 'Hair Coloring', description: 'Full hair coloring treatment', price: 15000, duration: 120 },
      { category: 'Hair', name: 'Hair Treatment', description: 'Deep conditioning treatment', price: 8000, duration: 90 },
      { category: 'Braids', name: 'Box Braids', description: 'Classic box braids', price: 20000, duration: 240 },
      { category: 'Braids', name: 'Cornrows', description: 'Traditional cornrow braiding', price: 8000, duration: 120 },
      { category: 'Braids', name: 'Knotless Braids', description: 'Knotless protective braids', price: 25000, duration: 300 },
      { category: 'Facials', name: 'Classic Facial', description: 'Deep cleansing facial', price: 12000, duration: 60 },
      { category: 'Facials', name: 'Anti-Aging Facial', description: 'Rejuvenating anti-aging treatment', price: 18000, duration: 75 },
      { category: 'Spa', name: 'Full Body Massage', description: 'Relaxing full body massage', price: 25000, duration: 90 },
      { category: 'Spa', name: 'Hot Stone Massage', description: 'Therapeutic hot stone massage', price: 30000, duration: 90 },
      { category: 'Makeup', name: 'Bridal Makeup', description: 'Complete bridal makeup', price: 50000, duration: 120 },
      { category: 'Makeup', name: 'Party Makeup', description: 'Glamorous party makeup', price: 20000, duration: 60 },
      { category: 'Pedicure', name: 'Classic Pedicure', description: 'Relaxing foot care', price: 6000, duration: 45 },
      { category: 'Pedicure', name: 'Gel Pedicure', description: 'Long-lasting gel pedicure', price: 10000, duration: 60 },
    ];

    for (const svc of services) {
      await query(`
        INSERT INTO services (category_id, name, description, price, duration, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [categoryIds[svc.category], svc.name, svc.description, svc.price, svc.duration, Math.random() > 0.6]);
    }

    // Employee users
    const employees = [
      { name: 'Fatima Bello', email: 'fatima@aishasalon.com', phone: '+2348023456789', specialization: 'Hair & Braids', experience: 5 },
      { name: 'Ngozi Okafor', email: 'ngozi@aishasalon.com', phone: '+2348034567890', specialization: 'Makeup & Facials', experience: 7 },
      { name: 'Amaka Eze', email: 'amaka@aishasalon.com', phone: '+2348045678901', specialization: 'Spa & Massage', experience: 4 },
      { name: 'Chidinma Nwosu', email: 'chidinma@aishasalon.com', phone: '+2348056789012', specialization: 'Pedicure & Nails', experience: 3 },
    ];

    for (const emp of employees) {
      const empPassword = await bcrypt.hash('Employee@123', 12);
      const empUserId = uuidv4();
      await query(`
        INSERT INTO users (id, name, email, phone, password, role, email_verified)
        VALUES ($1, $2, $3, $4, $5, 'employee', true)
        ON CONFLICT (email) DO NOTHING
      `, [empUserId, emp.name, emp.email, emp.phone, empPassword]);

      const userRes = await query('SELECT id FROM users WHERE email = $1', [emp.email]);
      if (userRes.rows[0]) {
        const empRes = await query(`
          INSERT INTO employees (user_id, specialization, experience_years, bio)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING RETURNING id
        `, [userRes.rows[0].id, emp.specialization, emp.experience, `${emp.name} is a skilled ${emp.specialization} specialist with ${emp.experience} years of experience.`]);

        if (empRes.rows[0]) {
          // Add availability (Mon-Sat)
          for (let day = 1; day <= 6; day++) {
            await query(`
              INSERT INTO availability (employee_id, day_of_week, start_time, end_time)
              VALUES ($1, $2, '09:00', '18:00')
              ON CONFLICT DO NOTHING
            `, [empRes.rows[0].id, day]);
          }
        }
      }
    }

    // Default settings
    const defaultSettings = [
      ['salon_name', "Aisha's Salon"],
      ['salon_email', 'info@aishasalon.com'],
      ['salon_phone', '+2348012345678'],
      ['salon_address', '15 Victoria Island, Lagos, Nigeria'],
      ['salon_description', "Lagos's premier luxury salon experience"],
      ['opening_time', '09:00'],
      ['closing_time', '19:00'],
      ['slot_duration', '30'],
      ['currency', 'NGN'],
      ['currency_symbol', '₦'],
      ['facebook', 'https://facebook.com/aishasalon'],
      ['instagram', 'https://instagram.com/aishasalon'],
      ['twitter', 'https://twitter.com/aishasalon'],
    ];

    for (const [key, value] of defaultSettings) {
      await query(`
        INSERT INTO settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, value]);
    }

    console.log('✅ Database seeded successfully');
    pool.end();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    pool.end();
  }
};

seed();
