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

    // Create mock users
    console.log("👥 Creating mock users...");
    const users = [
      {
        name: "Anna Kowalska",
        registrationDate: new Date("2024-03-01"),
        embedding: await generateRandomEmbedding(),
      },
      {
        name: "Jan Nowak",
        registrationDate: new Date("2024-03-05"),
        embedding: await generateRandomEmbedding(),
      },
      {
        name: "Maria Wiśniewska",
        registrationDate: new Date("2024-03-10"),
        embedding: await generateRandomEmbedding(),
      },
      {
        name: "Piotr Zieliński",
        registrationDate: new Date("2024-03-15"),
        embedding: await generateRandomEmbedding(),
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