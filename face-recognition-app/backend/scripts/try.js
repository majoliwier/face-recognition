const mongoose = require("mongoose");
const User = require("../models/User");
async function main() {
  try {
    await mongoose.connect("mongodb://localhost:27017/accessSystem", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = [
      {
        name: "Anna Kowalska",
        embedding: Array(128).fill(0.123),
      },
      {
        name: "Jan Nowak",
        embedding: Array(128).fill(0.456),
      },
    ];

    await User.insertMany(users);

    console.log("✅ Dodano użytkowników do bazy danych.");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Błąd podczas dodawania użytkowników:", err);
    process.exit(1);
  }
}

main();
