const mongoose = require("mongoose");
const User = require("../models/User");
const Log = require("../models/Log");

async function generateRandomEmbedding() {
  // Generate 128-dimensional embedding with random values between -1 and 1
  return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
}

async function main() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect("mongodb://localhost:27017/accessSystem");
    
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Log.deleteMany({});

    // Delete Python Embeddings
    const fs = require('fs');
    const path = require('path');
    const rootPath = './face_recognition_service/stored_embeddings';

    const excludedFiles = [
      '683c5501b4341b30c2990aed.npy',
      '683c615625ef1e33ae40a6b8.npy'
    ];

    fs.readdir(rootPath, (err, files) => {
      if (err) {
        console.error('Failed to read directory:', err);
        return;
      }

      files.forEach(file => {
        if (file.endsWith('.npy') && !excludedFiles.includes(file)) {
          const filePath = path.join(rootPath, file);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting ${file}:`, err);
            } else {
              console.log(`Deleted: ${file}`);
            }
          });
        }
      });
    });
    

    // Create mock users
    console.log("👥 Creating mock users...");
    const users = [
      {
        name: "Anna Kowalska",
        registrationDate: new Date("2024-03-01"),
        embedding: await generateRandomEmbedding(),
        imageURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        name: "Jan Nowak",
        registrationDate: new Date("2024-03-05"),
        embedding: await generateRandomEmbedding(),
        imageURL: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        name: "Maria Wiśniewska",
        registrationDate: new Date("2024-03-10"),
        embedding: await generateRandomEmbedding(),
        imageURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        name: "Piotr Zieliński",
        registrationDate: new Date("2024-03-15"),
        embedding: await generateRandomEmbedding(),
        imageURL: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log("✅ Users created successfully");

    // Create mock logs
    console.log("📝 Creating mock logs...");
    const logs = [];
    
    // Generate logs for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate 3-5 logs per day
      const logsPerDay = Math.floor(Math.random() * 3) + 3;
      
      for (let j = 0; j < logsPerDay; j++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const temperatura = 36 + Math.random() * 2; // Random temperature between 36-38°C
        const alkohol = Math.random() * 0.3; // Random alcohol level between 0-0.3
        
        logs.push({
          userId: randomUser._id,
          temperatura: parseFloat(temperatura.toFixed(1)),
          alkohol: parseFloat(alkohol.toFixed(2)),
          dopuszczony: temperatura < 37.5 && alkohol < 0.2,
          czas: new Date(date.setHours(
            Math.floor(Math.random() * 14) + 8, // Random hour between 8-22
            Math.floor(Math.random() * 60), // Random minute
            Math.floor(Math.random() * 60), // Random second
            0
          ))
        });
      }
    }

    // Add some logs without user ID (unrecognized attempts)
    for (let i = 0; i < 5; i++) {
      const temperatura = 36 + Math.random() * 2;
      const alkohol = Math.random() * 0.3;
      
      logs.push({
        temperatura: parseFloat(temperatura.toFixed(1)),
        alkohol: parseFloat(alkohol.toFixed(2)),
        dopuszczony: temperatura < 37.5 && alkohol < 0.2,
        czas: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      });
    }

    // Sort logs by date
    logs.sort((a, b) => b.czas - a.czas);
    
    await Log.insertMany(logs);
    console.log("✅ Logs created successfully");

    // Print summary
    console.log("\n📊 Database Reset Summary:");
    console.log(`- Created ${users.length} users`);
    console.log(`- Created ${logs.length} logs`);
    console.log(`- ${logs.filter(l => l.dopuszczony).length} successful entries`);
    console.log(`- ${logs.filter(l => !l.dopuszczony).length} denied entries`);
    console.log(`- ${logs.filter(l => !l.userId).length} unrecognized attempts`);

    await mongoose.disconnect();
    console.log("\n✨ Database reset completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main(); 