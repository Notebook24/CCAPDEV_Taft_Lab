// Import libraries/frameworks to be used
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();

// Middleware
app.use(express.json());
dotenv.config();

// Import models
const User = require("../models/user");
const Student = require("../models/student");
const Seat = require("../models/seat");
const Restricted_slots = require("../models/restricted_slots");
const Reservation = require("../models/reservation");
const Laboratory = require("../models/laboratory");
const Existing_class = require("../models/existing_class");
const Class_schedule = require("../models/class_schedule");
const Building = require("../models/building");
const Admin = require("../models/admin");

// Connect to Database
const connectServer = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conneted...");
    }
    catch(err){
        console.error("Error: " + err);
        process.exit(1);
    }
}

connectServer();


/*=== PLACE ALL APIs HERE BELOW ===*/





// Connect server to port
app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});

