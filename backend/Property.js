
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    city: { type: String, default: "" },
    address: { type: String, required: true },
    description: { type: String, default: "" },

    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},

    ownerPhoto: { type: String, default: "" },

    pgPhotos: [{ type: String }],

    singleRent: { type: Number, default: 0 },
    doubleRent: { type: Number, default: 0 },
    tripleRent: { type: Number, default: 0 },

    // Purane properties ke data ko support karne ke liye
    rent: { type: Number, default: 0 },
    roomType: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
