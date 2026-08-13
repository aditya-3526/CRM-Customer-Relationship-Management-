require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Communication = require('./models/Communication');
const User = require('./models/User');

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is not set. Run this from the directory containing .env');
  process.exit(1);
}

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@crm.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Sales Rep',
    email: 'sales@crm.com',
    password: 'password123',
    role: 'user'
  }
];

const sampleCustomers = [
  {
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0123',
    industry: 'Technology',
    location: 'San Francisco, CA',
    status: 'Active',
    stage: 'Lead',
    value: 50000,
    createdAt: new Date('2024-01-15'),
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@healthcare.com',
    phone: '+1-555-0124',
    industry: 'Healthcare',
    location: 'New York, NY',
    status: 'Active',
    stage: 'Contacted',
    value: 75000,
    createdAt: new Date('2024-02-10'),
  },
  {
    name: 'Mike Davis',
    email: 'mike.davis@finance.com',
    phone: '+1-555-0125',
    industry: 'Finance',
    location: 'Chicago, IL',
    status: 'Pending',
    stage: 'Proposal',
    value: 120000,
    createdAt: new Date('2024-03-05'),
  },
  {
    name: 'Emily Wilson',
    email: 'emily.wilson@retail.com',
    phone: '+1-555-0126',
    industry: 'Retail',
    location: 'Los Angeles, CA',
    status: 'Active',
    stage: 'Negotiation',
    value: 35000,
    createdAt: new Date('2024-04-12'),
  },
  {
    name: 'David Brown',
    email: 'david.brown@manufacturing.com',
    phone: '+1-555-0127',
    industry: 'Manufacturing',
    location: 'Detroit, MI',
    status: 'Inactive',
    stage: 'Closed Won',
    value: 25000,
    createdAt: new Date('2024-05-20'),
  },
  {
    name: 'Lisa Chen',
    email: 'lisa.chen@consulting.com',
    phone: '+1-555-0128',
    industry: 'Consulting',
    location: 'Boston, MA',
    status: 'Active',
    value: 95000,
    createdAt: new Date('2024-06-08'),
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@logistics.com',
    phone: '+1-555-0129',
    industry: 'Logistics',
    location: 'Dallas, TX',
    status: 'Pending',
    value: 45000,
    createdAt: new Date('2024-07-15'),
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@education.com',
    phone: '+1-555-0130',
    industry: 'Education',
    location: 'Miami, FL',
    status: 'Active',
    value: 28000,
    createdAt: new Date('2024-08-22'),
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@construction.com',
    phone: '+1-555-0131',
    industry: 'Construction',
    location: 'Phoenix, AZ',
    status: 'Inactive',
    value: 15000,
    createdAt: new Date('2024-09-30'),
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@marketing.com',
    phone: '+1-555-0132',
    industry: 'Marketing',
    location: 'Seattle, WA',
    status: 'Active',
    value: 65000,
    createdAt: new Date('2024-10-18'),
  },
  {
    name: 'Thomas Anderson',
    email: 'thomas.anderson@realestate.com',
    phone: '+1-555-0133',
    industry: 'Real Estate',
    location: 'Denver, CO',
    status: 'Pending',
    value: 85000,
    createdAt: new Date('2024-11-05'),
  },
  {
    name: 'Amanda Rodriguez',
    email: 'amanda.rodriguez@hospitality.com',
    phone: '+1-555-0134',
    industry: 'Hospitality',
    location: 'Las Vegas, NV',
    status: 'Active',
    value: 40000,
    createdAt: new Date('2024-12-12'),
  },
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    // Use the same connection string as the server. This previously hardcoded
    // mongodb://localhost:27017/crm-lite, which both ignored .env and pointed at
    // a different database name than the app reads from.
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', new URL(process.env.MONGO_URI).pathname);

    // Clear existing data
    await Customer.deleteMany({});
    await Communication.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample users (using create to trigger password hash middleware)
    for (const u of sampleUsers) {
      await User.create(u);
    }
    console.log('Inserted sample users');

    // Insert sample customers
    const customers = await Customer.insertMany(sampleCustomers);
    console.log('Inserted sample customers');

    // Create sample communications across multiple months
    const sampleCommunications = [
      // January 2024
      {
        customerId: customers[0]._id,
        type: 'Email',
        priority: 'High',
        status: 'Completed',
        notes: 'Initial contact and proposal discussion. Client showed strong interest.',
        date: new Date('2024-01-15'),
      },
      {
        customerId: customers[0]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Completed',
        notes: 'Contract negotiation meeting. Terms finalized successfully.',
        date: new Date('2024-01-20'),
      },

      // February 2024
      {
        customerId: customers[1]._id,
        type: 'Phone',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Discovery call to understand healthcare compliance requirements.',
        date: new Date('2024-02-10'),
      },
      {
        customerId: customers[1]._id,
        type: 'Video Call',
        priority: 'High',
        status: 'Completed',
        notes: 'Technical demonstration of our healthcare solutions.',
        date: new Date('2024-02-25'),
      },

      // March 2024
      {
        customerId: customers[2]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Scheduled',
        notes: 'Scheduled meeting to discuss financial sector implementation.',
        date: new Date('2024-03-05'),
      },
      {
        customerId: customers[0]._id,
        type: 'Email',
        priority: 'Low',
        status: 'Completed',
        notes: 'Follow-up email for additional feature requests.',
        date: new Date('2024-03-12'),
      },

      // April 2024
      {
        customerId: customers[3]._id,
        type: 'Phone',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Initial consultation for retail chain implementation.',
        date: new Date('2024-04-12'),
      },
      {
        customerId: customers[1]._id,
        type: 'Email',
        priority: 'High',
        status: 'Completed',
        notes: 'Contract renewal discussion and new feature proposals.',
        date: new Date('2024-04-20'),
      },

      // May 2024
      {
        customerId: customers[4]._id,
        type: 'Phone',
        priority: 'High',
        status: 'Completed',
        notes: 'Customer expressed dissatisfaction with current service level.',
        date: new Date('2024-05-20'),
      },
      {
        customerId: customers[2]._id,
        type: 'Video Call',
        priority: 'Medium',
        status: 'Scheduled',
        notes: 'Technical review meeting for finance compliance.',
        date: new Date('2024-05-28'),
      },

      // June 2024
      {
        customerId: customers[5]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Completed',
        notes: 'New consulting firm client. Excellent potential for long-term partnership.',
        date: new Date('2024-06-08'),
      },
      {
        customerId: customers[0]._id,
        type: 'Email',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Quarterly review and upsell opportunity discussion.',
        date: new Date('2024-06-15'),
      },

      // July 2024
      {
        customerId: customers[6]._id,
        type: 'Phone',
        priority: 'Medium',
        status: 'Pending',
        notes: 'Initial contact with logistics company. Need to schedule demo.',
        date: new Date('2024-07-15'),
      },
      {
        customerId: customers[4]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Completed',
        notes: 'Account review meeting. Customer decided to downgrade service.',
        date: new Date('2024-07-22'),
      },

      // August 2024
      {
        customerId: customers[7]._id,
        type: 'Email',
        priority: 'Low',
        status: 'Completed',
        notes: 'Welcome email and onboarding materials sent to new education client.',
        date: new Date('2024-08-22'),
      },
      {
        customerId: customers[1]._id,
        type: 'Phone',
        priority: 'High',
        status: 'Completed',
        notes: 'Emergency support call for healthcare system integration issues.',
        date: new Date('2024-08-30'),
      },

      // September 2024
      {
        customerId: customers[8]._id,
        type: 'Meeting',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Construction company struggling with implementation. Considering cancellation.',
        date: new Date('2024-09-30'),
      },
      {
        customerId: customers[5]._id,
        type: 'Video Call',
        priority: 'High',
        status: 'Completed',
        notes: 'Consulting firm expanding their contract. Great success story.',
        date: new Date('2024-09-15'),
      },

      // October 2024
      {
        customerId: customers[9]._id,
        type: 'Phone',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Marketing agency interested in our analytics platform.',
        date: new Date('2024-10-18'),
      },
      {
        customerId: customers[6]._id,
        type: 'Email',
        priority: 'Low',
        status: 'Completed',
        notes: 'Follow-up email for logistics demo. No response yet.',
        date: new Date('2024-10-25'),
      },

      // November 2024
      {
        customerId: customers[10]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Scheduled',
        notes: 'Real estate firm interested in our property management solution.',
        date: new Date('2024-11-05'),
      },
      {
        customerId: customers[8]._id,
        type: 'Phone',
        priority: 'High',
        status: 'Completed',
        notes: 'Construction company officially cancelled their contract.',
        date: new Date('2024-11-12'),
      },

      // December 2024
      {
        customerId: customers[11]._id,
        type: 'Email',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Hospitality client signed up for our premium package.',
        date: new Date('2024-12-12'),
      },
      {
        customerId: customers[9]._id,
        type: 'Video Call',
        priority: 'High',
        status: 'Completed',
        notes: 'Marketing agency demo went well. Contract negotiations in progress.',
        date: new Date('2024-12-20'),
      },

      // January 2025 (recent)
      {
        customerId: customers[0]._id,
        type: 'Phone',
        priority: 'Medium',
        status: 'Completed',
        notes: 'Annual contract renewal discussion. Client requesting price reduction.',
        date: new Date('2025-01-05'),
      },
      {
        customerId: customers[1]._id,
        type: 'Meeting',
        priority: 'High',
        status: 'Scheduled',
        notes: 'Healthcare client expanding to multiple locations.',
        date: new Date('2025-01-15'),
      },
      {
        customerId: customers[10]._id,
        type: 'Email',
        priority: 'High',
        status: 'Completed',
        notes: 'Real estate contract signed! New major client acquired.',
        date: new Date('2025-01-20'),
      },
    ];

    await Communication.insertMany(sampleCommunications);
    console.log('Inserted sample communications');

    console.log('Database seeded successfully!');
    console.log(`Created ${customers.length} customers and ${sampleCommunications.length} communications`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 