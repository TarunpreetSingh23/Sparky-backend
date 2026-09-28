const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in environment.');
  process.exit(1);
}

// Inline model definitions to avoid ESM/CommonJS path import issues during standalone script execution
const CitySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  state: String,
  country: String,
  center: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  boundary: {
    type: { type: String, default: 'Polygon' },
    coordinates: [[[Number]]]
  },
  isActive: { type: Boolean, default: true }
});
CitySchema.index({ boundary: '2dsphere' });
const City = mongoose.models.City || mongoose.model('City', CitySchema);

const ZoneSchema = new mongoose.Schema({
  cityId: mongoose.Schema.Types.ObjectId,
  name: String,
  slug: String,
  boundary: {
    type: { type: String, default: 'Polygon' },
    coordinates: [[[Number]]]
  },
  pricingMultiplier: { type: Number, default: 1.0 },
  surgeActive: { type: Boolean, default: false },
  surgeMultiplier: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true }
});
ZoneSchema.index({ boundary: '2dsphere' });
const Zone = mongoose.models.Zone || mongoose.model('Zone', ZoneSchema);

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  isActive: { type: Boolean, default: true },
  sortOrder: Number,
  genderApplicability: String,
  parentId: mongoose.Schema.Types.ObjectId
});
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const ServiceSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  categoryId: mongoose.Schema.Types.ObjectId,
  description: String,
  shortDescription: String,
  durationMinutes: Number,
  availableCities: [String],
  requiredSkills: [String],
  requiredGender: String,
  genderApplicability: String,
  isActive: { type: Boolean, default: true },
  bookingCount: { type: Number, default: 0 }
});
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

const ServicePackageSchema = new mongoose.Schema({
  serviceId: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  basePrice: Number, // paise
  productCost: Number, // paise
  professionalPayout: Number, // paise
  platformCommission: Number, // paise
  gstPercent: Number,
  gstAmount: Number,
  durationMinutes: Number,
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false }
});
const ServicePackage = mongoose.models.ServicePackage || mongoose.model('ServicePackage', ServicePackageSchema);

const ServiceAddonSchema = new mongoose.Schema({
  serviceId: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  price: Number, // paise
  professionalPayout: Number, // paise
  durationMinutes: Number,
  isActive: { type: Boolean, default: true }
});
const ServiceAddon = mongoose.models.ServiceAddon || mongoose.model('ServiceAddon', ServiceAddonSchema);

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI, { dbName: 'sparky_production' });
    console.log('Connected.');

    // 1. Clear existing seed data (conditional clean)
    console.log('Cleaning existing catalog seed data...');
    await City.deleteMany({ slug: 'amritsar' });
    await Category.deleteMany({ slug: 'beauty' });
    
    // Find or delete service related data
    const existingServices = await Service.find({ slug: { $in: ['waxing-full-arms', 'glow-facial', 'bridal-mehendi'] } });
    const serviceIds = existingServices.map(s => s._id);
    await Service.deleteMany({ _id: { $in: serviceIds } });
    await ServicePackage.deleteMany({ serviceId: { $in: serviceIds } });
    await ServiceAddon.deleteMany({ serviceId: { $in: serviceIds } });

    // 2. Seed City
    console.log('Seeding City (Amritsar)...');
    const city = await City.create({
      name: 'Amritsar',
      slug: 'amritsar',
      state: 'Punjab',
      country: 'IN',
      center: {
        type: 'Point',
        coordinates: [74.8723, 31.6340]
      },
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [74.75, 31.55],
          [74.98, 31.55],
          [74.98, 31.72],
          [74.75, 31.72],
          [74.75, 31.55] // close polygon
        ]]
      },
      isActive: true
    });

    // 3. Seed Zone
    console.log('Seeding Zone (Ranjit Avenue Zone)...');
    await Zone.deleteMany({ slug: 'ranjit-avenue-zone' });
    const zone = await Zone.create({
      cityId: city._id,
      name: 'Ranjit Avenue Zone',
      slug: 'ranjit-avenue-zone',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [74.82, 31.61],
          [74.92, 31.61],
          [74.92, 31.68],
          [74.82, 31.68],
          [74.82, 31.61] // close polygon
        ]]
      },
      pricingMultiplier: 1.0,
      surgeActive: false,
      isActive: true
    });

    // 4. Seed Category
    console.log('Seeding Category (Beauty)...');
    const category = await Category.create({
      name: 'Beauty',
      slug: 'beauty',
      description: 'Salon and beautician services at home',
      isActive: true,
      sortOrder: 1,
      genderApplicability: 'all'
    });

    // 5. Seed Service 1: Waxing
    console.log('Seeding Service 1: Waxing - Full Arms...');
    const s1 = await Service.create({
      name: 'Waxing — Full Arms',
      slug: 'waxing-full-arms',
      categoryId: category._id,
      description: 'Professional full arms waxing at doorstep using premium honey or Rica wax.',
      shortDescription: 'Doorstep honey & Rica waxing',
      durationMinutes: 40,
      availableCities: ['amritsar'],
      requiredSkills: ['waxing', 'honey_wax'],
      requiredGender: 'female',
      genderApplicability: 'female',
      isActive: true,
      bookingCount: 15
    });

    await ServicePackage.create([
      {
        serviceId: s1._id,
        name: 'Honey Waxing (Standard)',
        description: 'Standard honey wax application for clean, smooth arms.',
        basePrice: 34900, // ₹349
        productCost: 2000, // ₹20
        professionalPayout: 26175, // 75% of ₹349
        platformCommission: 8725, // 25% of ₹349
        gstPercent: 18,
        gstAmount: 6282, // 18% of ₹349
        durationMinutes: 30,
        isActive: true,
        isDefault: true
      },
      {
        serviceId: s1._id,
        name: 'Rica Waxing (Premium)',
        description: 'Colophony-free Rica wax, minimizes pain and redness.',
        basePrice: 59900, // ₹599
        productCost: 4000, // ₹40
        professionalPayout: 44925, // 75% of ₹599
        platformCommission: 14975, // 25% of ₹599
        gstPercent: 18,
        gstAmount: 10782,
        durationMinutes: 40,
        isActive: true,
        isDefault: false
      }
    ]);

    await ServiceAddon.create({
      serviceId: s1._id,
      name: 'Underarm Threading Addon',
      description: 'Additional quick underarm threading thread.',
      price: 4900, // ₹49
      professionalPayout: 3675, // 75% of ₹49
      durationMinutes: 10,
      isActive: true
    });

    // 6. Seed Service 2: Facial
    console.log('Seeding Service 2: Glow Facial...');
    const s2 = await Service.create({
      name: 'Glow Facial',
      slug: 'glow-facial',
      categoryId: category._id,
      description: 'Revitalize and clean your face skin with premium facial procedures.',
      shortDescription: 'Premium facial skin care',
      durationMinutes: 60,
      availableCities: ['amritsar'],
      requiredSkills: ['facial', 'massage'],
      requiredGender: 'female',
      genderApplicability: 'female',
      isActive: true,
      bookingCount: 8
    });

    await ServicePackage.create([
      {
        serviceId: s2._id,
        name: 'Fruit Glow Facial (Standard)',
        description: 'Standard organic fruit pulp facial treatment.',
        basePrice: 69900, // ₹699
        productCost: 5000,
        professionalPayout: 52425,
        platformCommission: 17475,
        gstPercent: 18,
        gstAmount: 12582,
        durationMinutes: 50,
        isActive: true,
        isDefault: true
      },
      {
        serviceId: s2._id,
        name: 'O3+ Radiance Facial (Premium)',
        description: 'Exclusive skin brightening facial by O3+ brand.',
        basePrice: 149900, // ₹1499
        productCost: 15000,
        professionalPayout: 112425,
        platformCommission: 37475,
        gstPercent: 18,
        gstAmount: 26982,
        durationMinutes: 60,
        isActive: true,
        isDefault: false
      }
    ]);

    await ServiceAddon.create({
      serviceId: s2._id,
      name: 'Detan Bleach Addon',
      description: 'Face and neck herbal detan bleaching.',
      price: 19900, // ₹199
      professionalPayout: 14925,
      durationMinutes: 15,
      isActive: true
    });

    // 7. Seed Service 3: Mehendi
    console.log('Seeding Service 3: Bridal Mehendi...');
    const s3 = await Service.create({
      name: 'Bridal Mehendi',
      slug: 'bridal-mehendi',
      categoryId: category._id,
      description: 'Intricate wedding design mehendi applied by top artists.',
      shortDescription: 'Bridal & wedding mehendi art',
      durationMinutes: 180,
      availableCities: ['amritsar'],
      requiredSkills: ['mehendi', 'henna'],
      requiredGender: 'any',
      genderApplicability: 'all',
      isActive: true,
      bookingCount: 4
    });

    await ServicePackage.create([
      {
        serviceId: s3._id,
        name: 'Classic Bridal Mehendi',
        description: 'Both hands full design up to elbows + feet design.',
        basePrice: 199900, // ₹1999
        productCost: 2000,
        professionalPayout: 149925,
        platformCommission: 49975,
        gstPercent: 18,
        gstAmount: 35982,
        durationMinutes: 120,
        isActive: true,
        isDefault: true
      },
      {
        serviceId: s3._id,
        name: 'Arabic Heavy Bridal Henna',
        description: 'Modern Arabic spaced dense patterns for bride hands & legs.',
        basePrice: 349900, // ₹3499
        productCost: 4000,
        professionalPayout: 262425,
        platformCommission: 87475,
        gstPercent: 18,
        gstAmount: 62982,
        durationMinutes: 180,
        isActive: true,
        isDefault: false
      }
    ]);

    await ServiceAddon.create({
      serviceId: s3._id,
      name: 'Glitter Highlights Addon',
      description: 'Applying gold/silver cosmetic glitter lines on mehendi.',
      price: 29900, // ₹299
      professionalPayout: 22425,
      durationMinutes: 20,
      isActive: true
    });

    console.log('Database successfully seeded with Amritsar catalog.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
