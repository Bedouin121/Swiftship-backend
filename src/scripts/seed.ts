import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from '../models/Vendor';
import Driver from '../models/Driver';
import Microhub from '../models/Microhub';
import Product from '../models/Product';
import Order from '../models/Order';
import Invoice from '../models/Invoice';
import InventoryLog from '../models/InventoryLog';

dotenv.config();

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftship';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Vendor.deleteMany({});
    await Driver.deleteMany({});
    await Microhub.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Invoice.deleteMany({});
    await InventoryLog.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Vendors
    const vendors = await Vendor.insertMany([
      {
        name: 'FreshMart',
        email: 'contact@freshmart.com',
        status: 'approved',
        products: 45,
        registeredAt: new Date('2024-01-15'),
      },
      {
        name: 'TechStore Pro',
        email: 'info@techstore.com',
        status: 'approved',
        products: 32,
        registeredAt: new Date('2024-02-20'),
      },
      {
        name: 'Fashion Hub',
        email: 'hello@fashionhub.com',
        status: 'pending',
        products: 0,
        registeredAt: new Date('2024-03-10'),
      },
      {
        name: 'Home Essentials',
        email: 'support@homeessentials.com',
        status: 'approved',
        products: 28,
        registeredAt: new Date('2024-01-05'),
      },
      {
        name: 'Sports Zone',
        email: 'info@sportszone.com',
        status: 'rejected',
        products: 0,
        registeredAt: new Date('2024-02-28'),
      },
    ]);
    console.log(`✅ Created ${vendors.length} vendors`);

    // Create Drivers
    const drivers = await Driver.insertMany([
      {
        name: 'Ahmed Rahman',
        phone: '+8801712345678',
        deliveries: 245,
        rating: 4.8,
        status: 'active',
        joinedAt: new Date('2023-12-01'),
      },
      {
        name: 'Fatima Khan',
        phone: '+8801712345679',
        deliveries: 189,
        rating: 4.9,
        status: 'active',
        joinedAt: new Date('2024-01-15'),
      },
      {
        name: 'Karim Ali',
        phone: '+8801712345680',
        deliveries: 156,
        rating: 4.6,
        status: 'active',
        joinedAt: new Date('2024-02-01'),
      },
      {
        name: 'Sadia Islam',
        phone: '+8801712345681',
        deliveries: 0,
        rating: 0,
        status: 'pending',
      },
      {
        name: 'Rashid Hasan',
        phone: '+8801712345682',
        deliveries: 98,
        rating: 4.4,
        status: 'active',
        joinedAt: new Date('2024-03-01'),
      },
    ]);
    console.log(`✅ Created ${drivers.length} drivers`);

    // Create Microhubs
    const microhubs = await Microhub.insertMany([
      {
        name: 'Dhanmondi Hub',
        location: 'Dhanmondi, Dhaka',
        capacity: 5000,
        utilized: 3200,
        status: 'active',
      },
      {
        name: 'Gulshan Hub',
        location: 'Gulshan, Dhaka',
        capacity: 8000,
        utilized: 5600,
        status: 'active',
      },
      {
        name: 'Uttara Hub',
        location: 'Uttara, Dhaka',
        capacity: 6000,
        utilized: 4200,
        status: 'active',
      },
      {
        name: 'Mirpur Hub',
        location: 'Mirpur, Dhaka',
        capacity: 4500,
        utilized: 2800,
        status: 'maintenance',
      },
    ]);
    console.log(`✅ Created ${microhubs.length} microhubs`);

    // Create Products for vendors
    const products = [];
    const categories = ['Electronics', 'Clothing', 'Food', 'Home & Garden', 'Sports'];
    
    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i];
      if (vendor.status === 'approved') {
        const productCount = vendor.products || 10;
        for (let j = 0; j < productCount; j++) {
          products.push({
            name: `Product ${j + 1} - ${vendor.name}`,
            sku: `SKU-${vendor._id}-${j + 1}`,
            category: categories[j % categories.length],
            price: Math.floor(Math.random() * 5000) + 100,
            stock: Math.floor(Math.random() * 100) + 10,
            description: `Description for product ${j + 1}`,
            vendorId: vendor._id,
          });
        }
      }
    }
    
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create Orders
    const orders = [];
    const statuses = ['Pending', 'Processing', 'In Transit', 'Delivered'];
    const customerNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
    
    for (let i = 0; i < 50; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      if (vendor.status === 'approved') {
        orders.push({
          customerName: customerNames[i % customerNames.length],
          productsCount: Math.floor(Math.random() * 5) + 1,
          total: Math.floor(Math.random() * 5000) + 500,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          eta: `${Math.floor(Math.random() * 24) + 1}h`,
          placedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          vendorId: vendor._id,
        });
      }
    }
    
    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Created ${createdOrders.length} orders`);

    // Create Invoices
    const invoices = [];
    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i];
      if (vendor.status === 'approved') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));
        
        invoices.push({
          vendor: vendor._id,
          amount: Math.floor(Math.random() * 50000) + 10000,
          status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue',
          dueDate,
        });
      }
    }
    
    const createdInvoices = await Invoice.insertMany(invoices);
    console.log(`✅ Created ${createdInvoices.length} invoices`);

    // Create Inventory Logs
    const inventoryLogs = [];
    const logTypes = ['Inbound', 'Outbound'];
    const processors = ['Admin User', 'System', 'Warehouse Manager'];
    
    for (let i = 0; i < 30; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      
      inventoryLogs.push({
        type: logTypes[Math.floor(Math.random() * logTypes.length)],
        product: product.name,
        quantity: Math.floor(Math.random() * 50) + 1,
        vendor: vendor.name,
        processedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        processedBy: processors[Math.floor(Math.random() * processors.length)],
      });
    }
    
    const createdLogs = await InventoryLog.insertMany(inventoryLogs);
    console.log(`✅ Created ${createdLogs.length} inventory logs`);

    console.log('\n🎉 Seed data created successfully!');
    console.log(`\nDemo Vendor ID (for testing): ${vendors[0]._id}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();

