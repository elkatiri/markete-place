require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");
const Category = require("./models/Category");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Product image URLs (royalty-free placeholders)
const productImages = {
  electronics: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800",
    "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800",
  ],
  vetements: [
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800",
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
  ],
  maison: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800",
  ],
  voitures: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-bd45ba8f2cda?w=800",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  ],
  livres: [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
  ],
};

const avatarImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
];

async function uploadToCloudinary(imageUrl, folder) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `marketplace/${folder}`,
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error(`Failed to upload image: ${imageUrl}`, err.message);
    return null;
  }
}

async function seed() {
  try {
    await connectDB();
    console.log("🌱 Starting seed...\n");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data.\n");

    // --- Categories ---
    const categoriesData = [
      { name: "Électronique", description: "Téléphones, ordinateurs, tablettes et accessoires" },
      { name: "Vêtements", description: "Mode homme, femme et enfant" },
      { name: "Maison & Jardin",  description: "Meubles, déco et articles de maison" },
      { name: "Voitures", description: "Voitures, motos et pièces détachées" },
      { name: "Sports & Loisirs",description: "Équipements sportifs et loisirs" },
      { name: "Livres", description: "Livres, manuels et magazines" },
    ];

    const categories = [];
    for (const data of categoriesData) {
      const cat = await Category.create(data);
      categories.push(cat);
    }
    console.log(`✅ Created ${categories.length} categories.\n`);

    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c._id;
    });

    // --- Users ---
    const usersData = [
      {
        name: "Youssef Amrani",
        email: "youssef.amrani@gmail.com",
        password: "password123",
        phone: "+212 661-234567",
        location: "Casablanca",
        bio: "Vendeur passionné d'électronique à Casablanca. Produits de qualité garantis!",
      },
      {
        name: "Fatima Zahra Bennani",
        email: "fatima.bennani@gmail.com",
        password: "password123",
        phone: "+212 662-345678",
        location: "Rabat",
        bio: "Maman et vendeuse de vêtements et articles maison à Rabat.",
      },
      {
        name: "Mohammed El Idrissi",
        email: "mohammed.idrissi@gmail.com",
        password: "password123",
        phone: "+212 663-456789",
        location: "Marrakech",
        bio: "Spécialiste automobile à Marrakech. Vente et conseil.",
      },
      {
        name: "Amina Tazi",
        email: "amina.tazi@gmail.com",
        password: "password123",
        phone: "+212 664-567890",
        location: "Fès",
        bio: "Passionnée de sport et de bien-être. Vente d'équipements sportifs à Fès.",
      },
      {
        name: "Karim Ouazzani",
        email: "karim.ouazzani@gmail.com",
        password: "password123",
        phone: "+212 665-678901",
        location: "Tanger",
        bio: "Libraire et amateur de livres rares à Tanger.",
      },
      {
        name: "Salma Chraibi",
        email: "salma.chraibi@gmail.com",
        password: "password123",
        phone: "+212 666-789012",
        location: "Agadir",
        bio: "Décoratrice d'intérieur à Agadir. Je vends mes trouvailles déco!",
      },
      {
        name: "Elkatri Ahmed",
        email: "elkatriahmed@gmail.com",
        password: "password123",
        phone: "+212 600-000000",
        location: "Casablanca",
        bio: "Platform administrator account.",
        role: "admin",
      },
    ];

    // Upload avatars
    console.log("📸 Uploading avatars to Cloudinary...");
    for (let i = 0; i < usersData.length; i++) {
      const uploaded = await uploadToCloudinary(avatarImages[i], "avatars");
      if (uploaded) usersData[i].avatar = uploaded.url;
      process.stdout.write(`  Avatar ${i + 1}/${usersData.length} ✓\n`);
    }

    const users = await User.create(usersData);
    console.log(`\n✅ Created ${users.length} Moroccan users.\n`);

    // --- Products ---
    const productsData = [
      // Youssef - Electronics (Casablanca)
      {
        title: "iPhone 14 Pro Max - 256GB",
        description: "iPhone 14 Pro Max en excellent état, acheté à Marjane Casablanca. Couleur violet intense, batterie à 94%. Livré avec boîte et chargeur d'origine. Facture disponible.",
        price: 9500,
        category: catMap["Électronique"],
        seller: 0,
        imageKey: "electronics",
        imageIndexes: [0, 1],
        location: "Casablanca",
        condition: "like-new",
      },
      {
        title: "MacBook Air M2 2023",
        description: "MacBook Air M2 couleur Minuit, 8Go RAM, 256Go SSD. Utilisé 3 mois seulement pour des cours à l'université. Parfait état, zéro rayure. Ideal pour étudiants.",
        price: 12000,
        category: catMap["Électronique"],
        seller: 0,
        imageKey: "electronics",
        imageIndexes: [2, 3],
        location: "Casablanca",
        condition: "like-new",
      },
      // Fatima - Clothing (Rabat)
      {
        title: "Caftan marocain traditionnel",
        description: "Magnifique caftan fait main par une maalma de Rabat. Tissu satin duchesse de haute qualité, broderie sfifa et aakad. Taille M/L. Porté une seule fois pour un mariage.",
        price: 3500,
        category: catMap["Vêtements"],
        seller: 1,
        imageKey: "vetements",
        imageIndexes: [0, 1],
        location: "Rabat",
        condition: "like-new",
      },
      {
        title: "Lot de vêtements bébé 0-12 mois",
        description: "Lot de 25 pièces pour bébé (bodies, pyjamas, bavoirs). Marques Zara Baby et H&M. En très bon état, mon bébé a grandi vite! Tailles de 0 à 12 mois.",
        price: 450,
        category: catMap["Vêtements"],
        seller: 1,
        imageKey: "vetements",
        imageIndexes: [2, 3],
        location: "Rabat",
        condition: "used",
      },
      // Mohammed - Cars (Marrakech)
      {
        title: "Dacia Logan 2020 - Diesel",
        description: "Dacia Logan 1.5 dCi, modèle 2020, 65000 km. Première main, toujours entretenue chez le concessionnaire. Climatisation, direction assistée, vitres électriques. Papiers en règle, visite technique valide.",
        price: 95000,
        category: catMap["Voitures"],
        seller: 2,
        imageKey: "voitures",
        imageIndexes: [0, 1],
        location: "Marrakech",
        condition: "used",
      },
      {
        title: "Peugeot 208 2022 - Essence",
        description: "Peugeot 208 Style, essence 1.2 PureTech, 2022, seulement 28000 km. Couleur blanche nacrée, intérieur noir. GPS, caméra de recul, Apple CarPlay. Prix négociable.",
        price: 165000,
        category: catMap["Voitures"],
        seller: 2,
        imageKey: "voitures",
        imageIndexes: [2, 3],
        location: "Marrakech",
        condition: "like-new",
      },
      // Amina - Sports (Fès)
      {
        title: "Vélo VTT Rockrider ST 520",
        description: "VTT Rockrider ST 520 acheté chez Decathlon Fès il y a 6 mois. Cadre aluminium taille M, 27.5 pouces, 21 vitesses. Très peu utilisé, parfait pour les sentiers du Moyen Atlas.",
        price: 2800,
        category: catMap["Sports & Loisirs"],
        seller: 3,
        imageKey: "sports",
        imageIndexes: [0, 1],
        location: "Fès",
        condition: "like-new",
      },
      {
        title: "Nike Air Max 90 - Taille 42",
        description: "Nike Air Max 90 neuves, jamais portées. Achetées en ligne, taille ne convient pas. Taille 42, couleur blanc/noir. Boîte d'origine incluse.",
        price: 850,
        category: catMap["Sports & Loisirs"],
        seller: 3,
        imageKey: "sports",
        imageIndexes: [2, 3],
        location: "Fès",
        condition: "new",
      },
      // Karim - Books (Tanger)
      {
        title: "Collection de livres Tahar Ben Jelloun",
        description: "Collection complète de 8 livres de Tahar Ben Jelloun en très bon état. Inclut 'La Nuit Sacrée', 'L'Enfant de Sable', 'Le Racisme expliqué à ma fille'. Parfait pour les amateurs de littérature marocaine.",
        price: 350,
        category: catMap["Livres"],
        seller: 4,
        imageKey: "livres",
        imageIndexes: [0, 1],
        location: "Tanger",
        condition: "used",
      },
      {
        title: "Manuels scolaires Bac Sciences Maths",
        description: "Lot complet de manuels scolaires pour le Bac Sciences Maths: Maths, Physique-Chimie, SVT et Philosophie. Programme marocain. Quelques annotations au crayon.",
        price: 200,
        category: catMap["Livres"],
        seller: 4,
        imageKey: "livres",
        imageIndexes: [2],
        location: "Tanger",
        condition: "used",
      },
      // Salma - Home (Agadir)
      {
        title: "Salon marocain traditionnel",
        description: "Salon marocain complet 6 places, tissu brocart de qualité supérieure. Matelas D30 très confortable. Couleur bordeaux et or. Tables en bois sculpté incluses. Fabriqué sur commande à Salé.",
        price: 8500,
        category: catMap["Maison & Jardin"],
        seller: 5,
        imageKey: "maison",
        imageIndexes: [0, 1],
        location: "Agadir",
        condition: "like-new",
      },
      {
        title: "Tapis Beni Ouarain authentique",
        description: "Authentique tapis berbère Beni Ouarain fait main. 100% laine naturelle, dimensions 2m x 3m. Motifs géométriques traditionnels noir sur blanc. Acheté directement auprès d'une coopérative dans le Moyen Atlas.",
        price: 4200,
        category: catMap["Maison & Jardin"],
        seller: 5,
        imageKey: "maison",
        imageIndexes: [2, 3],
        location: "Agadir",
        condition: "new",
      },
    ];

    // Upload product images
    console.log("📸 Uploading product images to Cloudinary...");
    const createdProducts = [];

    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const images = [];

      for (const idx of p.imageIndexes) {
        const imgUrl = productImages[p.imageKey][idx];
        const uploaded = await uploadToCloudinary(imgUrl, "products");
        if (uploaded) images.push(uploaded);
      }

      createdProducts.push({
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        seller: users[p.seller]._id,
        images,
        location: p.location,
        condition: p.condition,
        status: "active",
      });

      process.stdout.write(`  Product ${i + 1}/${productsData.length}: "${p.title}" ✓\n`);
    }

    await Product.insertMany(createdProducts);
    console.log(`\n✅ Created ${createdProducts.length} products.\n`);

    // Summary
    console.log("=".repeat(50));
    console.log("🎉 Seed completed successfully!");
    console.log("=".repeat(50));
    console.log(`\n👥 Users: ${users.length}`);
    console.log(`📦 Products: ${createdProducts.length}`);
    console.log(`📁 Categories: ${categories.length}`);
    console.log(`\n🔑 All users password: password123`);
    console.log("\n📧 User emails:");
    users.forEach((u) => console.log(`   - ${u.email} (${u.location})`));

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
