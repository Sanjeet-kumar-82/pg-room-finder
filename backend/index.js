
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const Property = require("./Property");
const User = require("./User");
const Booking = require("./Booking");

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please login first.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "JWT_SECRET .env file mein set nahi hai.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Session invalid hai. Dobara login karein.",
    });
  }
}

function requireOwner(req, res, next) {
  if (req.user?.role !== "owner") {
    return res.status(403).json({
      message: "Sirf owner ye action kar sakta hai.",
    });
  }

  next();
}

function requireCustomer(req, res, next) {
  if (req.user?.role !== "customer") {
    return res.status(403).json({
      message: "Sirf customer room book kar sakta hai.",
    });
  }

  next();
}

// Image upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 11,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Sirf image files upload kar sakte hain."));
    }
  },
});

// Test backend
app.get("/", (req, res) => {
  res.json({
    message: "PG & Room Finder Backend is running!",
  });
});

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all fields correctly.",
      });
    }

    if (!["owner", "customer"].includes(role)) {
      return res.status(400).json({
        message: "Please select Owner or Customer.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Signup successful!",

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    return res.status(500).json({
      message: "Signup failed. Check the backend terminal.",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email aur password bharna zaroori hai.",
      });
    }

    if (!["owner", "customer"].includes(role)) {
      return res.status(400).json({
        message: "Owner ya Customer select karein.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "The email or password is incorrect."
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: `this account ${
          user.role === "owner" ? "Owner" : "Customer"
        }  to the . Please use the correct login page.`,
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Backend terminal check karein.",
    });
  }
});

// Add property: owner only
app.post(
  "/api/properties",
  authenticateToken,
  requireOwner,
  upload.fields([
    { name: "ownerPhoto", maxCount: 1 },
    { name: "pgPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const {
        ownerName,
        ownerPhone,
        pgName,
        title,
        city,
        address,
        description,
        singleRent,
        doubleRent,
        tripleRent,
      } = req.body;

      if (
        !ownerName?.trim() ||
        !ownerPhone?.trim() ||
        !(pgName || title)?.trim() ||
        !address?.trim()
      ) {
        return res.status(400).json({
          message:
            "Owner name, phone, PG name aur address bharna zaroori hai.",
        });
      }

      for (const rent of [singleRent, doubleRent, tripleRent]) {
        if (
          rent !== undefined &&
          rent !== "" &&
          (!Number.isFinite(Number(rent)) || Number(rent) < 0)
        ) {
          return res.status(400).json({
            message: "Rent valid number hona chahiye.",
          });
        }
      }

      const ownerPhoto = req.files?.ownerPhoto?.[0]
        ? `/uploads/${req.files.ownerPhoto[0].filename}`
        : "";

      const pgPhotos = (req.files?.pgPhotos || []).map(
        (file) => `/uploads/${file.filename}`
      );

      const property = await Property.create({
        title: (pgName || title).trim(),
        city: (city || "").trim(),
        address: address.trim(),
        description: (description || "").trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerPhoto,
        pgPhotos,
        singleRent: Number(singleRent) || 0,
        doubleRent: Number(doubleRent) || 0,
        tripleRent: Number(tripleRent) || 0,
        ownerId: req.user.id,
      });

      return res.status(201).json({
        message: "Property saved successfully!",
        property,
      });
    } catch (error) {
      console.error("Save property error:", error);

      return res.status(500).json({
        message: "Could not save property.",
      });
    }
  }
);

// Get all properties
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(properties);
  } catch (error) {
    console.error("Fetch properties error:", error);

    return res.status(500).json({
      message: "Could not fetch properties.",
    });
  }
});
// Get one property for editing
app.get(
  "/api/properties/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      const property = await Property.findOne({
        _id: id,
        ownerId: req.user.id,
      });

      if (!property) {
        return res.status(404).json({
          message: "Property nahi mili ya aap iske owner nahi hain.",
        });
      }

      return res.status(200).json({ property });
    } catch (error) {
      console.error("Load property error:", error);

      return res.status(500).json({
        message: "Property load nahi ho payi.",
      });
    }
  }
);
// Delete owner's property
app.delete(
  "/api/properties/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      const deletedProperty = await Property.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.user.id,
      });

      if (!deletedProperty) {
        return res.status(404).json({
          message: "Property nahi mili ya aap iske owner nahi hain.",
        });
      }

      return res.status(200).json({
        message: "Property successfully delete ho gayi.",
      });
    } catch (error) {
      console.error("Delete property error:", error);

      return res.status(500).json({
        message: "Property delete nahi ho payi.",
      });
    }
  }
);


/* Owner updates their own property */
app.put(
  "/api/properties/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      const {
        title,
        pgName,
        city,
        address,
        description,
        roomType,
        rent,
        singleRent,
        doubleRent,
        tripleRent,
        ownerName,
        ownerPhone,
      } = req.body;

      const property = await Property.findOne({
        _id: id,
        ownerId: req.user.id,
      });

      if (!property) {
        return res.status(404).json({
          message: "Property nahi mili ya aap iske owner nahi hain.",
        });
      }

      if (city !== undefined && !String(city).trim()) {
        return res.status(400).json({
          message: "City bharna zaroori hai.",
        });
      }

      const rentFields = {
        rent,
        singleRent,
        doubleRent,
        tripleRent,
      };

      for (const [field, value] of Object.entries(rentFields)) {
        if (
          value !== undefined &&
          (!Number.isFinite(Number(value)) || Number(value) < 0)
        ) {
          return res.status(400).json({
            message: `${field} valid number hona chahiye.`,
          });
        }
      }

      if (title !== undefined || pgName !== undefined) {
        const newTitle = String(pgName ?? title ?? "").trim();

        if (!newTitle) {
          return res.status(400).json({
            message: "Property ka naam bharna zaroori hai.",
          });
        }

        property.title = newTitle;
      }

      if (city !== undefined) property.city = String(city).trim();
      if (address !== undefined) property.address = String(address).trim();
      if (description !== undefined) {
        property.description = String(description).trim();
      }
      if (ownerName !== undefined) {
        property.ownerName = String(ownerName).trim();
      }
      if (ownerPhone !== undefined) {
        property.ownerPhone = String(ownerPhone).trim();
      }

      if (singleRent !== undefined) {
        property.singleRent = Number(singleRent);
      }
      if (doubleRent !== undefined) {
        property.doubleRent = Number(doubleRent);
      }
      if (tripleRent !== undefined) {
        property.tripleRent = Number(tripleRent);
      }

      // Purani properties mein rent field bhi ho sakti hai.
      if (rent !== undefined && property.rent !== undefined) {
        property.rent = Number(rent);
      }

      if (roomType !== undefined) {
        property.roomType = roomType;
      }

      await property.save();

      return res.status(200).json({
        message: "Property successfully update ho gayi!",
        property,
      });
    } catch (error) {
      console.error("Update property error:", error);

      return res.status(500).json({
        message: "Property update nahi ho payi.",
      });
    }
  }
);


 // Create room booking: customer only
app.post(
  "/api/bookings",
  authenticateToken,
  requireCustomer,
  async (req, res) => {
    try {
      const {
        propertyId,
        roomType,
        customerName,
        customerPhone,
      } = req.body;

      if (
        typeof propertyId !== "string" ||
        typeof customerName !== "string" ||
        typeof customerPhone !== "string" ||
        !customerName.trim() ||
        !customerPhone.trim()
      ) {
        return res.status(400).json({
          message: "Please fill all booking details.",
        });
      }

      if (!["Single", "Double", "Triple"].includes(roomType)) {
        return res.status(400).json({
          message: "Invalid room type.",
        });
      }

      if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
        return res.status(400).json({
          message: "Enter a valid 10-digit phone number.",
        });
      }

      if (!mongoose.isValidObjectId(propertyId)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      const property = await Property.findById(propertyId);

      if (!property) {
        return res.status(404).json({
          message: "Property not found.",
        });
      }

      const rentField = {
        Single: "singleRent",
        Double: "doubleRent",
        Triple: "tripleRent",
      }[roomType];

      let monthlyRent = Number(property[rentField]);

// Purani properties ke liye fallback
if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
  monthlyRent = Number(property.rent);
}

if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
  return res.status(400).json({
    message: "Is room ka rent available nahi hai. Owner se rent update karwayein.",
  });
}

      const booking = await Booking.create({
        propertyId: property._id,
        ownerId: property.ownerId,
        customerId: req.user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        roomType,
        monthlyRent,
      });

      return res.status(201).json({
        message: "Booking request submitted successfully.",
        booking,
      });
    }catch (error) {
      console.error("BOOKING ERROR:", error);

      return res.status(500).json({
        message: error.message || "Booking failed.",
        details: error.errors
          ? Object.values(error.errors).map((e) => e.message)
          : null,
      });
        }
  }
);


// Customer views their own bookings
app.get(
  "/api/customer/bookings",
  authenticateToken,
  requireCustomer,
  async (req, res) => {
    try {
      const bookings = await Booking.find({
        customerId: req.user.id,
      })
        .populate("propertyId", "title city address")
        .sort({ createdAt: -1 });

      return res.status(200).json(bookings);
    } catch (error) {
      console.error("Fetch customer bookings error:", error);

      return res.status(500).json({
        message: "Could not load your bookings.",
      });
    }
  }
);

// Owner views bookings for their own properties
app.get(
  "/api/owner/bookings",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const bookings = await Booking.find({
        ownerId: req.user.id,
      })
        .populate("propertyId", "title city address")
        .sort({ createdAt: -1 });

      return res.status(200).json(bookings);
    } catch (error) {
      console.error("Fetch owner bookings error:", error);

      return res.status(500).json({
        message: "Could not load bookings.",
      });
    }
  }
);

/* Customer cancels their own booking */
app.patch(
  "/api/customer/bookings/:id/cancel",
  authenticateToken,
  requireCustomer,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid booking ID.",
        });
      }

      const booking = await Booking.findOneAndUpdate(
        {
          _id: id,
          customerId: req.user.id,
          status: { $in: ["Pending", "Confirmed"] },
        },
        { $set: { status: "Cancelled" } },
        { new: true, runValidators: true }
      ).populate("propertyId", "title city address");

      if (!booking) {
        return res.status(404).json({
          message: "Booking nahi mili, ya pehle hi cancel ho chuki hai.",
        });
      }

      return res.status(200).json({
        message: "Booking successfully cancel ho gayi.",
        booking,
      });
    } catch (error) {
      console.error("Cancel customer booking error:", error);

      return res.status(500).json({
        message: "Booking cancel nahi ho payi.",
      });
    }
  }
);

/* Customer deletes their own cancelled booking */
app.delete(
  "/api/customer/bookings/:id",
  authenticateToken,
  requireCustomer,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid booking ID.",
        });
      }

      const deletedBooking = await Booking.findOneAndDelete({
        _id: req.params.id,
        customerId: req.user.id,
        status: "Cancelled",
      });

      if (!deletedBooking) {
        return res.status(404).json({
          message:
            "Cancelled booking nahi mili ya aap iske owner nahi hain.",
        });
      }

      return res.status(200).json({
        message: "Cancelled booking successfully delete ho gayi.",
      });
    } catch (error) {
      console.error("Delete customer booking error:", error);

      return res.status(500).json({
        message: "Booking delete nahi ho payi.",
      });
    }
  }
);

/* Owner deletes a confirmed booking */
app.delete(
  "/api/owner/bookings/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid booking ID.",
        });
      }

      const deletedBooking = await Booking.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.user.id,
        status: "Confirmed",
      });

      if (!deletedBooking) {
        return res.status(404).json({
          message:
            "Confirmed booking nahi mili ya aapko ise delete karne ki permission nahi hai.",
        });
      }

      return res.status(200).json({
        message:
          "Confirmed booking delete ho gayi. Customer ke My Bookings se bhi hat jayegi.",
      });
    } catch (error) {
      console.error("Delete confirmed booking error:", error);

      return res.status(500).json({
        message: "Booking delete nahi ho payi.",
      });
    }
  }
);

/* Owner accepts or rejects a booking */
app.patch(
  "/api/owner/bookings/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid booking ID.",
        });
      }

      if (!["Confirmed", "Cancelled"].includes(status)) {
        return res.status(400).json({
          message: "Status must be Confirmed or Cancelled.",
        });
      }

      const booking = await Booking.findOneAndUpdate(
        {
          _id: req.params.id,
          ownerId: req.user.id,
          status: "Pending",
        },
        { status },
        { new: true, runValidators: true }
      ).populate("propertyId", "title city address");

      if (!booking) {
        return res.status(404).json({
          message: "Pending booking not found.",
        });
      }

      return res.status(200).json({
        message:
          status === "Confirmed"
            ? "Booking accepted successfully."
            : "Booking rejected successfully.",
        booking,
      });
    } catch (error) {
      console.error("Update booking status error:", error);

      return res.status(500).json({
        message: "Could not update booking status.",
      });
    }
  }
);

// Handle upload errors as JSON
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Har image 5 MB se chhoti honi chahiye."
          : "Image upload limit exceed ho gayi.",
    });
  }

  if (err) {
    return res.status(400).json({
      message: err.message || "Upload failed.",
    });
  }

  next();
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI .env file mein set nahi hai.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET .env file mein set nahi hai.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
