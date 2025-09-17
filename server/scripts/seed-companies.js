import 'dotenv/config';
import mongoose from 'mongoose';
import Company from '../models/Company.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGO_URI;

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Create super admin
    const superAdmin = await User.findOneAndUpdate(
      { email: 'superadmin@mtumrah.com' },
      {
        name: 'Super Admin',
        email: 'superadmin@mtumrah.com',
        passwordHash: await bcrypt.hash('superadmin123', 10),
        role: 'super_admin',
        canAccessAllCompanies: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create companies with separate databases
    const companies = [
      {
        name: 'Marwah Travels',
        description: 'Premium Umrah and Hajj services',
        contactInfo: {
          email: 'info@marwahtravels.com',
          phone: '+92-300-1234567',
          address: 'Karachi, Pakistan'
        },
        primaryColor: '#3B82F6',
        databaseConfig: {
          uri: process.env.MONGO_URI,
          dbName: 'company_marwah_travels'
        }
      },
      {
        name: 'Mustafa Travels & Tour',
        description: 'Reliable travel services',
        contactInfo: {
          email: 'info@mustafatravels.com',
          phone: '+92-300-2345678',
          address: 'Lahore, Pakistan'
        },
        primaryColor: '#10B981',
        databaseConfig: {
          uri: process.env.MONGO_URI,
          dbName: 'company_mustafa_travels_tour'
        }
      },
      {
        name: 'Holy Travels & Tour',
        description: 'Spiritual journey specialists',
        contactInfo: {
          email: 'info@holytravels.com',
          phone: '+92-300-3456789',
          address: 'Islamabad, Pakistan'
        },
        primaryColor: '#F59E0B',
        databaseConfig: {
          uri: process.env.MONGO_URI,
          dbName: 'company_holy_travels_tour'
        }
      }
    ];

    for (const companyData of companies) {
      const company = await Company.create(companyData);

      // Create admin for each company
      const adminEmail = companyData.contactInfo.email.replace('info@', 'admin@');
      const adminUser = await User.create({
        name: `${companyData.name} Admin`,
        email: adminEmail,
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        company: company._id
      });

      console.log(`✅ Created company: ${company.name}`);
      console.log(`   - Database: ${company.databaseConfig.dbName}`);
      console.log(`   - Admin: ${adminUser.email} / admin123`);
    }

    console.log('\n🎉 All companies created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: superadmin@mtumrah.com / superadmin123');
    console.log('Marwah Admin: admin@marwahtravels.com / admin123');
    console.log('Mustafa Admin: admin@mustafatravels.com / admin123');
    console.log('Holy Admin: admin@holytravels.com / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
})();
