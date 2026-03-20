// Import libraries/frameworks to be used
const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require('node-cron'); // Add this for scheduling

const app = express();

// Middleware
app.use(express.json());
dotenv.config({path: path.resolve(__dirname, "../../.env")});
app.use(cors());

// Import models
const Users = require("../models/user");
const Students = require("../models/student");
const Seats = require("../models/seat");
const Restricted_Slots = require("../models/restricted_slots");
const Reservations = require("../models/reservation");
const Laboratories = require("../models/laboratory");
const Buildings = require("../models/building");
const Admins = require("../models/admin");
const { createDecipheriv } = require("crypto");

// Connect to Database
const connectServer = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'taft_lab_db'
        });
        console.log("Connected...");
    }
    catch(err){
        console.error("Error: " + err);
        process.exit(1);
    }
}

connectServer();


/*=== OBJECT FOR SESSION ===*/
app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: "false",
        saveUninitialized: false
    })
);

/*=== CONFIGURATION FOR APP TO USE SESSION ===*/
app.use(cookieParser());

/* =============== AUTOMATIC RESERVATION UPDATER =============== */

// Function to update expired ongoing/checked reservations to Completed
async function updateExpiredReservations() {
    try {
        const now = new Date();
        
        // Get current time in Manila timezone (UTC+8)
        const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
        const currentTime = manilaTime.getHours().toString().padStart(2, '0') + ':' +
                           manilaTime.getMinutes().toString().padStart(2, '0') + ':' +
                           manilaTime.getSeconds().toString().padStart(2, '0');
        const currentDate = manilaTime.toISOString().split('T')[0];
        
        console.log(`[AUTO-UPDATE] Running at ${currentDate} ${currentTime} (Manila Time)`);
        
        // Find all reservations that are either Ongoing or Checked
        // and whose end time has passed
        const expiredReservations = await Reservations.find({
            status: { $in: ["Ongoing", "Checked"] },
            date_reserved: { $lte: new Date(currentDate) },
            reserve_endTime: { $lt: currentTime }
        });
        
        if (expiredReservations.length === 0) {
            console.log(`[AUTO-UPDATE] No expired reservations found`);
            return;
        }
        
        console.log(`[AUTO-UPDATE] Found ${expiredReservations.length} expired reservations to update`);
        
        // Update each expired reservation to Completed
        for (const reservation of expiredReservations) {
            try {
                await Reservations.findByIdAndUpdate(
                    reservation._id,
                    { status: "Completed" },
                    { new: true }
                );
                
                // Also update seat statuses to Available if they're not blocked
                const seatIds = reservation.seat_id;
                if (seatIds && seatIds.length > 0) {
                    // Check if seats are still reserved by any other ongoing/checked reservations
                    const activeReservationsForSeats = await Reservations.findOne({
                        seat_id: { $in: seatIds },
                        status: { $in: ["Ongoing", "Checked"] },
                        _id: { $ne: reservation._id }
                    });
                    
                    // If no other active reservations for these seats, mark them as Available
                    if (!activeReservationsForSeats) {
                        await Seats.updateMany(
                            { _id: { $in: seatIds } },
                            { status: "Available" }
                        );
                    }
                }
                
                console.log(`[AUTO-UPDATE] Updated reservation ${reservation._id} to Completed`);
            } catch (err) {
                console.error(`[AUTO-UPDATE] Error updating reservation ${reservation._id}:`, err);
            }
        }
        
        console.log(`[AUTO-UPDATE] Completed updating ${expiredReservations.length} reservations`);
        
    } catch (err) {
        console.error("[AUTO-UPDATE] Error in updateExpiredReservations:", err);
    }
}

// Schedule the job to run every 30 minutes
// The cron expression "*/30 * * * *" means every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running scheduled reservation update...');
    await updateExpiredReservations();
}, {
    timezone: "Asia/Manila" // Set to Philippines Time
});

// Also run immediately on server start to catch any missed updates
setTimeout(async () => {
    console.log('[INIT] Running initial reservation update on server start...');
    await updateExpiredReservations();
}, 5000); // Run 5 seconds after server starts

/* =============== END AUTOMATIC RESERVATION UPDATER =============== */

/*=== PLACE ALL APIs HERE BELOW ===*/

/* =============== USER SIDE APIs =============== */

/* Sign up a user */
app.post("/signup", async(req, res) => {
    try{
        const userData = {
            fn: req.body.first_name,
            mn: req.body.middle_name,
            ln: req.body.last_name,
            email: req.body.email_address,
            pw: req.body.password, 
            st: req.body.student_type,  
            dep: req.body.department,
            bio: req.body.bio || ""
        };

        if(!userData.fn || !userData.mn || !userData.ln || !userData.email || !userData.pw || !userData.st || !userData.dep) {
            return res.status(400).json({ message: "Please fill all the fields!" })
        }

        const existingUser = await Users.findOne({email: userData.email});
        if(existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedUserPW = await bcrypt.hash(userData.pw, 10);

        const newUser = new Users({
            user_type: "student",
            email: userData.email,
            user_password: hashedUserPW,
            full_name: userData.fn + " " + userData.mn + " " + userData.ln
        });

        const savedUser = await newUser.save();

        const newStudent = new Students({
            user_id: savedUser._id,
            student_type: userData.st,
            department: userData.dep,
            bio: userData.bio
        });

        await newStudent.save();

        res.status(201).json({
            message: "User registered successfully!"
        });
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/* USER LOGIN */
app.post("/login", async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: "Email not found" });
        }

        const correctPass = await bcrypt.compare(password, user.user_password);
        if(!correctPass) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        req.session.user = user;

        res.json({
            message: "Login successful!",
            user_type: user.user_type,
            user_id: user._id
        });
            
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/* GET CURRENT USER PROFILE */
app.get("/user/profile/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await Users.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const student = await Students.findOne({ user_id: user_id });

        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            user_type: user.user_type,
            student_type: student?.student_type || null,
            department: student?.department || null,
            bio: student?.bio || ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE USER PROFILE */
app.put("/user/profile/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;
        const { full_name, student_type, department, bio } = req.body;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const updatedUser = await Users.findByIdAndUpdate(
            user_id,
            { full_name },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedStudent = await Students.findOneAndUpdate(
            { user_id: user_id },
            { student_type, department, bio },
            { new: true, runValidators: true }
        );

        res.json({
            message: "Profile updated successfully",
            _id: updatedUser._id,
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            student_type: updatedStudent?.student_type || null,
            department: updatedStudent?.department || null,
            bio: updatedStudent?.bio || ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* CHANGE USER PASSWORD */
app.put("/user/change-password/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;
        const { currentPassword, newPassword } = req.body;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }

        const user = await Users.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const correctPass = await bcrypt.compare(currentPassword, user.user_password);
        if (!correctPass) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await Users.findByIdAndUpdate(
            user_id,
            { user_password: hashedPassword },
            { new: true, runValidators: true }
        );

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* VIEW OTHER USER'S PUBLIC PROFILE */
app.get("/user/view-profile/:userName", async (req, res) => {
    try {
        const userName = req.params.userName;

        if (!userName || userName.trim() === '') {
            return res.status(400).json({ error: "Username is required" });
        }

        const user = await Users.findOne({ full_name: userName });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const student = await Students.findOne({ user_id: user._id });

        const reservations = await Reservations.find({ 
            user_id: user._id,
            status: { $in: ["Ongoing", "Completed", "Checked"] }
        })
            .populate("building_id", "building_name")
            .populate("lab_id", "room_code")
            .populate("seat_id", "seat_number")
            .sort({ date_reserved: -1 });

        const convertTo12Hour = (timeStr) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
        };

        const formatDate = (date) => {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(date).toLocaleDateString('en-US', options);
        };

        const formattedReservations = reservations.map(reservation => ({
            id: reservation._id.toString(),
            building: reservation.building_id?.building_name || "Unknown",
            room: reservation.lab_id?.room_code || "Unknown",
            seat: reservation.seat_id.map(seat => seat.seat_number).join(", "),
            date: formatDate(reservation.date_reserved),
            time: `${convertTo12Hour(reservation.reserve_startTime)} - ${convertTo12Hour(reservation.reserve_endTime)}`,
            status: reservation.status === "Ongoing" ? "Active" : reservation.status
        }));

        res.json({
            _id: user._id,
            full_name: user.full_name,
            user_type: user.user_type,
            student_type: student?.student_type || null,
            college: student?.department || "N/A",
            bio: student?.bio || "",
            reservations: formattedReservations
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* FETCH A SINGLE BUILDING */
app.get("/user/reservation", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.query.building_id)){ 
            return res.status(400).json({ error: "Invalid building ID" }); 
        }

        const building = await Buildings.findOne({ _id: req.query.building_id });

        if(!building)
            return res.status(404).json({ error: "Building not found" });

        res.json(building);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* USER RESERVATION PAGE */
app.get("/user/reservation/:building_id", async (req, res) => {
    try {
        const date = req.query.date;
        
        if(!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid Building ID" });
        }

        if(!date) {
            return res.status(400).json({ error: "Missing date query parameter" });
        }

        const laboratories = await Laboratories.find({ building_id: req.params.building_id });

        const result = await Promise.all(laboratories.map(async lab => {
            const reservations = await Reservations.find({ 
                lab_id: lab._id, 
                date_reserved: new Date(date)
            });

            return {
                lab_id: lab._id,
                room: lab.room_code,
                capacity: lab.capacity,
                reservations    
            };
        }));

        res.json({ result });
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});

/* GET SEAT DATA WITH RESERVATION STATUS FOR CONFIRMATION PAGE */
app.get("/user/reservation/:building_id/:lab_id/seats", async (req, res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { date, startTime, endTime } = req.query;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ error: "Missing date, startTime, or endTime query parameters" });
        }

        const laboratory = await Laboratories.findOne({
            _id: lab_id,
            building_id: building_id
        });

        if (!laboratory) {
            return res.status(404).json({ error: "Laboratory not found" });
        }

        const seats = await Seats.find({
            building_id: building_id,
            lab_id: lab_id
        }).sort({ seat_number: 1 });

        const limitedSeats = seats.slice(0, laboratory.capacity);
        const seatNumbers = limitedSeats.map(seat => seat.seat_number);

        const existingSeatsByNumber = {};
        limitedSeats.forEach(seat => {
            existingSeatsByNumber[seat.seat_number] = seat;
        });

        const reservations = await Reservations.find({
            building_id: building_id,
            lab_id: lab_id,
            date_reserved: new Date(date),
            status: { $in: ["Ongoing", "Completed", "Checked"] },
            reserve_startTime: { $lt: endTime },
            reserve_endTime: { $gt: startTime }
        }).populate("user_id", "full_name");

        const reservedSeatsMap = {};
        reservations.forEach(reservation => {
            reservation.seat_id.forEach(seatId => {
                reservedSeatsMap[seatId.toString()] = {
                    name: reservation.is_anonymous ? "Anonymous" : (reservation.user_id?.full_name || "Anonymous"),
                    reservation_id: reservation._id
                };
            });
        });

        const seatData = {};
        const seatNumberToIdMap = {};
        
        seatNumbers.forEach(seatNumber => {
            const existingSeat = existingSeatsByNumber[seatNumber];
            
            if (existingSeat) {
                const seatIdStr = existingSeat._id.toString();
                seatNumberToIdMap[seatNumber] = seatIdStr;
                
                if (reservedSeatsMap[seatIdStr]) {
                    seatData[seatNumber] = {
                        status: "taken",
                        name: reservedSeatsMap[seatIdStr].name,
                        reservation_id: reservedSeatsMap[seatIdStr].reservation_id,
                        seat_id: seatIdStr
                    };
                } else {
                    seatData[seatNumber] = {
                        status: "available",
                        seat_id: seatIdStr
                    };
                }
            }
        });

        res.json({
            lab_id: laboratory._id,
            room_code: laboratory.room_code,
            capacity: laboratory.capacity,
            total_seats: seatNumbers.length,
            seat_data: seatData,
            seat_number_to_id_map: seatNumberToIdMap
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* USER RESERVATION CONFIRMATION */
app.post("/user/reservation/confirm", async (req, res) => {
    try {
        const {
            lab_id,
            reserve_date,
            reserve_startTime,
            reserve_endTime,
            building_id,
            seat_id,
            is_anonymous,
            email,
            password
        } = req.body;

        if (!lab_id || !reserve_date || !reserve_startTime || !reserve_endTime || !building_id || !seat_id || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const user = await Users.findOne({ email });
        if(!user) {
            return res.status(400).json({ error: "Email not found" });
        }

        const correctPass = await bcrypt.compare(password, user.user_password);
        if(!correctPass) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        const processedSeatIds = [];
        for (const sId of seat_id) {
            if (mongoose.Types.ObjectId.isValid(sId)) {
                processedSeatIds.push(new mongoose.Types.ObjectId(sId));
            } else {
                const newSeat = new Seats({
                    building_id: new mongoose.Types.ObjectId(building_id),
                    lab_id: new mongoose.Types.ObjectId(lab_id),
                    seat_number: sId
                });
                const savedSeat = await newSeat.save();
                processedSeatIds.push(savedSeat._id);
            }
        }

        const seatConflict = await Reservations.findOne({
            lab_id, 
            date_reserved: new Date(reserve_date),
            reserve_startTime,
            reserve_endTime,
            status: "Ongoing",
            seat_id: { $in: processedSeatIds }
        });

        if(seatConflict) {
            return res.status(400).json({ error: "The seat(s) you chose are already taken." });
        }

        const newReservation = new Reservations({
            user_id: user._id,
            building_id,
            lab_id,
            seat_id: processedSeatIds, 
            date_reserved: new Date(reserve_date),
            reserve_startTime,
            reserve_endTime,
            status: "Ongoing",
            is_anonymous
        });

        await newReservation.save();
    
        res.status(201).json({
            message: "Reservation has been confirmed!"
        });

    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/* USER RESERVATION HISTORY */
app.get("/user/:user_id/reservation-history", async (req, res) => {
    try {
        const user_id = req.params.user_id;

        if(!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const reservations = await Reservations.find({ user_id })
            .populate("building_id", "building_name")
            .populate("lab_id", "room_code")
            .populate("seat_id", "seat_number")
            .sort({ date_reserved: -1 });

        const formattedReservations = reservations.map(reservation => {
            const convertTo12Hour = (timeStr) => {
                if (!timeStr) return "";
                const [hours, minutes] = timeStr.split(':');
                const hour = parseInt(hours);
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
            };

            const formatDate = (date) => {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            };

            const seatNumbers = reservation.seat_id.map(seat => seat.seat_number).join(", ");

            return {
                id: reservation._id.toString(),
                buildingName: reservation.building_id?.building_name || "Unknown",
                roomCode: reservation.lab_id?.room_code || "Unknown",
                seat: seatNumbers,
                requestedDate: formatDate(reservation.date_reserved),
                requestedTime: formatDate(reservation.date_reserved),
                reservationDate: formatDate(reservation.date_reserved),
                reservationTime: `${convertTo12Hour(reservation.reserve_startTime)} - ${convertTo12Hour(reservation.reserve_endTime)}`,
                status: reservation.status === "Ongoing" ? "Active" : reservation.status,
                isOngoing: reservation.status === "Ongoing"
            };
        });

        res.json(formattedReservations);
    }   
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/* CANCEL A RESERVATION */
app.post("/user/reservation-history/:reservation_id/cancel", async (req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        const cancelReservation = await Reservations.findByIdAndUpdate(
            req.params.reservation_id,
            { status: "Cancelled" },
            { new: true }
        );

        if(!cancelReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json({ message: "Reservation has been cancelled" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/* CHECK IN A RESERVATION
 * Simply marks the reservation as Checked. The check_in_deadline was already
 * set by /start-checkin-window when the slot start time was reached, so we
 * do NOT change it here. The timer was already counting from slot start.
 */
app.post("/user/reservation-history/:reservation_id/check-in", async (req, res) => {
    try{
        if(!mongoose.Types.ObjectId.isValid(req.params.reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        const confirmReservation = await Reservations.findByIdAndUpdate(
            req.params.reservation_id,
            { status: "Checked" },
            { new: true }
        );

        if(!confirmReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json({ message: "Reservation has been checked in successfully!" });
    }
    catch(err) {
        res.status(500).json({ error: err.message });
    }
});

/* RESCHEDULE A RESERVATION */
app.post("/user/reservation-history/:reservation_id/reschedule", async (req, res) => {
    try{
        if(!mongoose.Types.ObjectId.isValid(req.params.reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        const { reserve_startTime, reserve_endTime } = req.body;

        if(!reserve_startTime || !reserve_endTime) {
            return res.status(400).json({ error: "Missing required time fields" });
        }

        if(reserve_endTime <= reserve_startTime) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        const reschedReservation = await Reservations.findByIdAndUpdate(
            req.params.reservation_id,
            { reserve_startTime, reserve_endTime },
            { new: true }
        );

        if(!reschedReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json({ message: "Reservation has been rescheduled!" });
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
});


/* GET BUILDING BY CODE */
app.get("/getBuilding", async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ error: "Building code required" });
        }
        
        console.log(`[DEBUG] Searching for building with code: "${code}"`);
        
        const building = await Buildings.findOne({ building_code: code });
        
        if (!building) {
            console.log(`[DEBUG] Building not found with code: "${code}". Searching all buildings...`);
            const allBuildings = await Buildings.find({});
            console.log(`[DEBUG] Available buildings:`, allBuildings.map(b => ({ code: b.building_code, name: b.building_name })));
            return res.status(404).json({ error: `Building not found with code: "${code}"` });
        }
        
        console.log(`[DEBUG] Building found:`, building);
        res.json(building);
    } catch (err) {
        console.error(`[ERROR] Error fetching building:`, err);
        res.status(500).json({ error: err.message });
    }
});

/* USER ADVANCED SEARCH */
app.post("/user/advanced-search", async (req, res) => {
    try {
        const { searchDate, timeSlot, showOnlyAvailable, buildingID, labID } = req.body;

        let startTime = "00:00";
        let endTime = "23:59";

        if (timeSlot) {
            const times = timeSlot.split("-").map(t => t.trim());
            if (times.length === 2) {
                startTime = times[0];
                endTime = times[1];
            }
        }

        let labFilter = {};

        if (buildingID && buildingID !== "ALL") {
            const building = await Buildings.findOne({ building_code: buildingID });
            if (building) {
                labFilter.building_id = building._id;
            } else {
                return res.status(404).json({ error: "Building not found" });
            }
        }

        if (labID && labID !== "ALL") {
            const lab = await Laboratories.findOne({ room_code: labID });
            if (lab) {
                labFilter._id = lab._id;
            } else {
                return res.status(404).json({ error: "Laboratory not found" });
            }
        }

        const labs = await Laboratories.find(labFilter).populate("building_id");

        const reservations = await Reservations.find({
            date_reserved: new Date(searchDate),
            status: { $in: ["Ongoing", "Completed", "Checked"] },
            reserve_startTime: { $lt: endTime },
            reserve_endTime: { $gt: startTime }
        });

        const results = [];

        for (const lab of labs) {
            const reservationsForLab = reservations.filter(r =>
                r.lab_id.toString() === lab._id.toString()
            );

            let reservedSeats = 0;
            for (const reservation of reservationsForLab) {
                reservedSeats += reservation.seat_id.length;
            }

            const availableSeats = lab.capacity - reservedSeats;
            const status = availableSeats > 0 ? "Available" : "Full";

            const labResult = {
                id: lab._id.toString(),
                building: lab.building_id?.building_code || "Unknown",
                laboratory: lab.room_code,
                date: searchDate,
                time: timeSlot || "All Times",
                availableSeats,
                status
            };
            results.push(labResult);
        }

        const finalResults = showOnlyAvailable 
            ? results.filter(lab => lab.status === "Available") 
            : results;

        res.json(finalResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* VIEW OTHER PROFILE */
app.get("/user/profile/:user_id", async (req, res) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.user_id)){
            return res.status(400).json({ error: "User not found" });
        }
    
        const user = await Users.findById(req.params.user_id);
        const student = await Students.findOne({ user_id: req.params.user_id });
        const reservations = await Reservations.find({ user_id: req.params.user_id })
            .populate("building_id")
            .populate("lab_id")
            .populate("seat_id");

        const resultReservation = reservations.map(r => ({
            building: r.building_id.building_name,
            room: r.lab_id.room_code,
            seat: r.seat_id.map(s => s.seat_number).join(", "),
            date: r.date_reserved.toString(),
            time: r.reserve_startTime + " - " + r.reserve_endTime,
            status: r.status
        }));

        res.json({
            name: user.full_name,
            user_type: user.user_type,
            department: student.department,
            bio: student.bio,
            reservations: resultReservation
        });
    }
    catch(err) {
        res.status(500).json({error: err.message});
    }
});

/* DELETE USER */
app.delete("/user/view-profile/:user_id/delete_user", async (req, res) => {
    try{
         if (!mongoose.Types.ObjectId.isValid(req.params.user_id)){
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await Users.findById(req.params.user_id);
        if(!user) {
            return res.status(404).json({ error: "Could not find specified user "});
        }

        await Students.deleteOne({ user_id: req.params.user_id });
        await Users.deleteOne({ _id: req.params.user_id });

        res.json({ message: "User has been deleted successfully!" });
    }
    catch(err) {
        res.status(500).json({error: err.message});
    }
});





/* =============== ADMIN SIDE APIs =============== */


/* ADMIN HOME PAGE */

// /admin
// for getting all buildings
app.get("/admin", async (req,res) => {
    try {
        const buildings = await Buildings.find();
        res.json(buildings);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

/* ADMIN HOME PAGE ADDITIONAL APIs */
// 2. /admin/stats/total_students
// total registered students
app.get("/admin/stats/total_students", async (req, res) => {
    try {
        const count = await Students.countDocuments();
        res.json({ total_students: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. /admin/stats/total_reservations
// total reservations ever made
app.get("/admin/stats/total_reservations", async (req, res) => {
    try {
        const count = await Reservations.countDocuments();
        res.json({ total_reservations: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* ADMIN BUILDING DASHBOARD */

// 1. Get all laboratories from a specific building
app.get("/admin/:building_id/laboratories", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)){
            return res.status(400).json({ error: "Invalid building ID" });
        }
        const laboratories = await Laboratories.find({building_id: req.params.building_id});

        const result = await Promise.all(
            laboratories.map(async (lab) => {
                const count = await Reservations.countDocuments({
                    lab_id: lab._id,
                    status: { $in: ["Ongoing", "Checked"] }
                });
                return {
                    ...lab.toObject(),
                    reservation_count: count
                };
            })
        );

        res.json(result);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 2. Get all reservations for a building
app.get("/admin/:building_id/laboratories/reservations", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        const reservations = await Reservations.find({building_id: req.params.building_id})
            .populate("user_id", "full_name email")
            .populate("seat_id", "seat_number")
            .populate("lab_id", "lab_name room_code")
            .populate("building_id", "building_name");
        res.json(reservations);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 3. Get 5 most recent students who reserved in a building
app.get("/admin/:building_id/laboratories/recent_students", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        const latest_reservations = await Reservations.find({building_id: req.params.building_id})
            .sort({date_reserved: -1, reserve_startTime: -1})
            .limit(5);

        const result = await Promise.all(
            latest_reservations.map(async (lr) => {
                const user = await Users.findOne({_id: lr.user_id});
                const student = await Students.findOne({user_id: lr.user_id});
                return {
                    ...lr.toObject(),
                    full_name: user ? user.full_name : "N/A",
                    department: student ? student.department : "N/A"
                };
            })
        );
        
        res.json(result);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 4. Get specific building
app.get("/admin/:building_id", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        const building = await Buildings.findOne({_id: req.params.building_id});
        res.json(building);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});


/* ADMIN MANAGE SEAT RESERVATION PAGE */

// 1. Get specific room in a specific building
app.get("/admin/:building_id/laboratory/:lab_id", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        const laboratory = await Laboratories.findOne({
            building_id: req.params.building_id, 
            _id: req.params.lab_id
        });

        if (!laboratory){
            return res.status(404).json({ error: "Laboratory not found in this building" });
        }
        res.json(laboratory);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 2. Get all seats in a specific laboratory
app.get("/admin/:building_id/laboratory/:lab_id/seats", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(req.params.lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        const seats = await Seats.find({
            building_id: req.params.building_id, 
            lab_id: req.params.lab_id
        });

        if (!seats || seats.length === 0){
            return res.status(404).json({ error: "Seats not found in this laboratory and building" });
        }
        res.json(seats);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 3. Reserve available seats (walk-in)
app.post("/admin/:building_id/laboratory/:lab_id/reserve_seat", async (req, res) => {
    try {
        const { building_id, lab_id } = req.params;
        // name removed — email alone identifies the student
        const { seat_numbers, email, date_reserved, reserve_startTime, reserve_endTime } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        // name removed from required fields check
        if (!email || !date_reserved || !reserve_startTime || !reserve_endTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!seat_numbers || !Array.isArray(seat_numbers) || seat_numbers.length === 0) {
            return res.status(400).json({ error: "seat_numbers must be a non-empty array" });
        }

        if (reserve_endTime <= reserve_startTime) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const seats = await Seats.find({ seat_number: { $in: seat_numbers }, lab_id, building_id });
        if (!seats || seats.length !== seat_numbers.length) {
            return res.status(404).json({ error: "One or more seats not found" });
        }

        const seatIds = seats.map(s => s._id);

        const conflict = await Reservations.findOne({
            seat_id: { $in: seatIds },
            date_reserved: new Date(date_reserved),
            status: { $in: ["Ongoing", "Checked"] },
            reserve_startTime: { $lt: reserve_endTime },
            reserve_endTime: { $gt: reserve_startTime }
        });

        if (conflict) {
            return res.status(400).json({ error: "One or more seats already reserved for that time range" });
        }

        const blockConflict = await Restricted_Slots.findOne({
            seat_id: { $in: seatIds },
            restricted_date: new Date(date_reserved),
            start_time: { $lt: reserve_endTime },
            end_time: { $gt: reserve_startTime }
        });

        if (blockConflict) {
            return res.status(400).json({ error: "One or more seats are blocked during this time" });
        }

        const reservation = await Reservations.create({
            user_id: user._id,
            building_id,
            lab_id,
            seat_id: seatIds,
            date_reserved: new Date(date_reserved),
            reserve_startTime,
            reserve_endTime,
            status: "Ongoing"
        });

        await Seats.updateMany(
            { _id: { $in: seatIds } },
            { status: "Occupied" }
        );

        res.status(201).json({
            message: "Reservation created successfully",
            reservation,
            seats
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Block a seat
app.post("/admin/:building_id/laboratory/:lab_id/block_seat", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { seat_number, restricted_date, start_time, end_time } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        if (!seat_number || !restricted_date || !start_time || !end_time) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (end_time <= start_time) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        const seat = await Seats.findOne({ seat_number, lab_id, building_id });
        if (!seat) {
            return res.status(404).json({ error: "Seat not found" });
        }

        const existingReservation = await Reservations.findOne({
            seat_id: { $in: [seat._id] },
            date_reserved: new Date(restricted_date),
            status: { $in: ["Ongoing", "Checked"] },
            reserve_startTime: { $lt: end_time },
            reserve_endTime: { $gt: start_time }
        });

        if (existingReservation) {
            return res.status(400).json({
                error: "Cannot block seat - there is an existing reservation during this time"
            });
        }

        const existingBlock = await Restricted_Slots.findOne({
            seat_id: seat._id,
            restricted_date: new Date(restricted_date),
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        });

        if (existingBlock) {
            return res.status(400).json({
                error: "Seat is already blocked during part of this time range"
            });
        }

        const restricted_slot = await Restricted_Slots.create({
            building_id,
            lab_id,
            seat_id: seat._id,
            restricted_date: new Date(restricted_date),
            start_time,
            end_time
        });

        const updatedSeat = await Seats.findByIdAndUpdate(
            seat._id,
            { status: "Closed" },
            { new: true, runValidators: true }
        );

        if (!updatedSeat) {
            return res.status(404).json({ error: "Seat not found" });
        }

        res.status(201).json({
            message: "Seat blocked successfully",
            restricted_slot,
            seat: updatedSeat
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 5. Unblock a seat
app.post("/admin/:building_id/laboratory/:lab_id/unblock_seat", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { seat_number } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        if (!seat_number) {
            return res.status(400).json({ error: "Seat number is required" });
        }

        const seat = await Seats.findOne({ seat_number, lab_id, building_id });
        if (!seat) {
            return res.status(404).json({ error: "Seat not found" });
        }

        const deleted = await Restricted_Slots.deleteMany({
            seat_id: seat._id,
            lab_id,
            building_id
        });

        if (deleted.deletedCount === 0) {
            return res.status(404).json({ error: "No restricted slots found for this seat" });
        }

        const updatedSeat = await Seats.findByIdAndUpdate(
            seat._id,
            { status: "Available" },
            { new: true, runValidators: true }
        );

        res.json({ 
            message: "Seat unblocked successfully",
            seat: updatedSeat,
            removed_slots: deleted.deletedCount 
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 6. View details of a reservation for a specific seat
app.get("/admin/:building_id/laboratory/:lab_id/view_details/:seat_id", async (req,res) => {
    try {
        const {building_id, lab_id, seat_id} = req.params;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: { $in: ["Ongoing", "Checked"] }
        })
        .populate("user_id", "full_name email")
        .populate("seat_id", "seat_number")
        .populate("lab_id", "lab_name room_code")
        .populate("building_id", "building_name");

        if (!reservation) {
            return res.status(404).json({ error: "No active reservation for this seat" });
        }

        res.json({
            full_name: reservation.user_id.full_name,
            email: reservation.user_id.email,
            seat_numbers: reservation.seat_id.map(s => s.seat_number),
            laboratory: reservation.lab_id.lab_name,
            room_code: reservation.lab_id.room_code,
            building: reservation.building_id.building_name,
            date_reserved: reservation.date_reserved,
            start_time: reservation.reserve_startTime,
            end_time: reservation.reserve_endTime,
            reservation_id: reservation._id,
            reservation_status: reservation.status,
            check_in_deadline: reservation.check_in_deadline
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 7. Edit a reservation
app.put("/admin/:building_id/laboratory/:lab_id/edit_reservation/:seat_id", async (req, res) => {
    try {
        const { building_id, lab_id, seat_id } = req.params;
        const { email, seat_numbers, date_reserved, start_time, end_time } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: { $in: ["Ongoing", "Checked"] }
        });

        if (!reservation) {
            return res.status(404).json({ error: "No active reservation for this seat" });
        }

        const updates = {};
        let seatsChanged = false;
        let newSeatIds = null;
        let oldSeatIds = reservation.seat_id;

        if (date_reserved) {
            const newDate = new Date(date_reserved);
            if (isNaN(newDate.getTime())) {
                return res.status(400).json({ error: "Invalid date format" });
            }
            updates.date_reserved = newDate;
        }

        if (start_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(start_time)) {
                return res.status(400).json({ error: "Invalid start time format. Use HH:MM or HH:MM:SS" });
            }
            updates.reserve_startTime = start_time;
        }

        if (end_time) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(end_time)) {
                return res.status(400).json({ error: "Invalid end time format. Use HH:MM or HH:MM:SS" });
            }
            updates.reserve_endTime = end_time;
        }

        if ((start_time || end_time) && !seat_numbers) {
            const newStartTime = start_time || reservation.reserve_startTime;
            const newEndTime = end_time || reservation.reserve_endTime;
            if (newEndTime <= newStartTime) {
                return res.status(400).json({ error: "End time must be after start time" });
            }
        }

        if (seat_numbers) {
            if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
                return res.status(400).json({ error: "seat_numbers must be a non-empty array" });
            }

            const newSeats = await Seats.find({ seat_number: { $in: seat_numbers }, lab_id, building_id });
            if (!newSeats || newSeats.length !== seat_numbers.length) {
                return res.status(404).json({ error: "One or more seats not found in this laboratory" });
            }

            const closedSeat = newSeats.find(s => s.status === "Closed");
            if (closedSeat) {
                return res.status(400).json({ error: `Seat ${closedSeat.seat_number} is currently Closed` });
            }

            newSeatIds = newSeats.map(s => s._id);

            const conflictingReservation = await Reservations.findOne({
                building_id, lab_id,
                seat_id: { $in: newSeatIds },
                date_reserved: date_reserved ? new Date(date_reserved) : reservation.date_reserved,
                reserve_startTime: { $lt: end_time || reservation.reserve_endTime },
                reserve_endTime: { $gt: start_time || reservation.reserve_startTime },
                status: { $in: ["Ongoing", "Checked"] },
                _id: { $ne: reservation._id }
            });

            if (conflictingReservation) {
                return res.status(400).json({ error: "One or more seats are already reserved for the specified time slot" });
            }

            const blockConflict = await Restricted_Slots.findOne({
                seat_id: { $in: newSeatIds },
                restricted_date: date_reserved ? new Date(date_reserved) : reservation.date_reserved,
                start_time: { $lt: end_time || reservation.reserve_endTime },
                end_time: { $gt: start_time || reservation.reserve_startTime }
            });

            if (blockConflict) {
                return res.status(400).json({ error: "One or more seats are blocked during this time" });
            }

            updates.seat_id = newSeatIds;
            seatsChanged = true;
        }

        if (Object.keys(updates).length === 0) {
            const populatedReservation = await Reservations.findById(reservation._id)
                .populate("user_id", "full_name email")
                .populate("seat_id", "seat_number")
                .populate("lab_id", "room_code lab_name")
                .populate("building_id", "building_name");

            return res.json({
                message: "No changes requested",
                full_name: populatedReservation.user_id.full_name,
                email: populatedReservation.user_id.email,
                seat_numbers: populatedReservation.seat_id.map(s => s.seat_number),
                laboratory: populatedReservation.lab_id.lab_name,
                room_code: populatedReservation.lab_id.room_code,
                building: populatedReservation.building_id.building_name,
                date_reserved: populatedReservation.date_reserved,
                start_time: populatedReservation.reserve_startTime,
                end_time: populatedReservation.reserve_endTime
            });
        }

        if ((date_reserved || start_time || end_time) && !seat_numbers) {
            const conflictQuery = {
                building_id, lab_id,
                seat_id: { $in: oldSeatIds },
                date_reserved: updates.date_reserved || reservation.date_reserved,
                reserve_startTime: { $lt: updates.reserve_endTime || reservation.reserve_endTime },
                reserve_endTime: { $gt: updates.reserve_startTime || reservation.reserve_startTime },
                status: { $in: ["Ongoing", "Checked"] },
                _id: { $ne: reservation._id }
            };

            const conflictingReservation = await Reservations.findOne(conflictQuery);
            if (conflictingReservation) {
                return res.status(400).json({ error: "The requested changes conflict with an existing reservation" });
            }
        }

        const updatedReservation = await Reservations.findByIdAndUpdate(
            reservation._id,
            updates,
            { new: true, runValidators: true }
        )
        .populate("user_id", "full_name email")
        .populate("seat_id", "seat_number")
        .populate("lab_id", "room_code lab_name")
        .populate("building_id", "building_name");

        if (seatsChanged && newSeatIds) {
            await Seats.updateMany({ _id: { $in: oldSeatIds } }, { status: "Available" });
            await Seats.updateMany({ _id: { $in: newSeatIds } }, { status: "Occupied" });
        }

        const updatedFields = [];
        if (date_reserved) updatedFields.push("date");
        if (start_time) updatedFields.push("start time");
        if (end_time) updatedFields.push("end time");
        if (seat_numbers) updatedFields.push("seats");

        res.json({
            message: `Reservation updated successfully. Changed: ${updatedFields.join(", ")}`,
            full_name: updatedReservation.user_id.full_name,
            email: updatedReservation.user_id.email,
            seat_numbers: updatedReservation.seat_id.map(s => s.seat_number),
            laboratory: updatedReservation.lab_id.lab_name,
            room_code: updatedReservation.lab_id.room_code,
            building: updatedReservation.building_id.building_name,
            date_reserved: updatedReservation.date_reserved,
            start_time: updatedReservation.reserve_startTime,
            end_time: updatedReservation.reserve_endTime
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: "This combination of user, building, lab, seat, date, and time already exists" 
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// 8. Remove / cancel a reservation
// Cancellation rules:
//   - Checked-in reservations cannot be cancelled
//   - check_in_deadline is null (window not started yet) → always allowed
//   - check_in_deadline is set AND now <= deadline       → allowed
//   - check_in_deadline is set AND now > deadline        → BLOCKED
app.delete("/admin/:building_id/laboratory/:lab_id/remove_reservation/:seat_id", async (req, res) => {
    try {
        const { building_id, lab_id, seat_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: { $in: ["Ongoing", "Checked"] }
        });

        if (!reservation) {
            return res.status(404).json({ error: "No active reservation found for this seat" });
        }

        // ── CANCELLATION WINDOW ENFORCEMENT ────────────────────────────────────
        // Checked-in reservations cannot be cancelled
        if (reservation.status === "Checked") {
            return res.status(403).json({
                error: "Cannot cancel a checked-in reservation. The user has already checked in."
            });
        }
        
        // The window only becomes enforced AFTER start-checkin-window has been
        // called (i.e. check_in_deadline is stored in the DB). Before that,
        // the slot hasn't started from the admin's perspective, so cancel is
        // always allowed regardless of the current wall clock time.
        if (reservation.check_in_deadline) {
            const now = new Date();
            if (now > new Date(reservation.check_in_deadline)) {
                return res.status(403).json({
                    error: "Cancellation window has expired. The 10-minute check-in period has already passed."
                });
            }
        }
        // ── END ENFORCEMENT ────────────────────────────────────────────────────

        const allSeatIds = reservation.seat_id;

        await Reservations.findByIdAndUpdate(
            reservation._id,
            { status: "Cancelled" },
            { new: true }
        );

        await Seats.updateMany(
            { _id: { $in: allSeatIds } },
            { status: "Available" }
        );

        const cancelledReservationDetails = await Reservations.findById(reservation._id)
            .populate("user_id", "full_name email")
            .populate("seat_id", "seat_number")
            .populate("lab_id", "room_code lab_name")
            .populate("building_id", "building_name");

        res.json({
            message: "Reservation removed successfully",
            details: {
                full_name: cancelledReservationDetails?.user_id?.full_name || "N/A",
                email: cancelledReservationDetails?.user_id?.email || "N/A",
                seat_numbers: cancelledReservationDetails?.seat_id?.map(s => s.seat_number) || [],
                laboratory: cancelledReservationDetails?.lab_id?.lab_name || "N/A",
                room_code: cancelledReservationDetails?.lab_id?.room_code || "N/A",
                building: cancelledReservationDetails?.building_id?.building_name || "N/A",
                date_reserved: cancelledReservationDetails?.date_reserved || "N/A",
                start_time: cancelledReservationDetails?.reserve_startTime || "N/A",
                end_time: cancelledReservationDetails?.reserve_endTime || "N/A",
                status: "Cancelled"
            }
        });

    } catch (err) {
        console.error("Error removing reservation:", err);
        res.status(500).json({ error: err.message });
    }
});

// 9. Get all available seats in a lab for a specific date and time
app.get("/admin/:building_id/laboratory/:lab_id/available_seats", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { date, start_time, end_time } = req.query;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        const allSeats = await Seats.find({ building_id, lab_id });

        if (!allSeats || allSeats.length === 0) {
            return res.status(404).json({ error: "No seats found in this laboratory" });
        }

        if (!date || !start_time || !end_time) {
            return res.json(allSeats);
        }

        const reservationsWithConflict = await Reservations.find({
            building_id,
            lab_id,
            date_reserved: new Date(date),
            status: { $in: ["Ongoing", "Checked"] },
            reserve_startTime: { $lt: end_time },
            reserve_endTime: { $gt: start_time }
        }).select("seat_id");

        const reservedSeatIds = reservationsWithConflict.flatMap(r => r.seat_id.map(id => id.toString()));

        const blockedSeats = await Restricted_Slots.find({
            building_id,
            lab_id,
            restricted_date: new Date(date),
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        }).distinct('seat_id');

        const blockedSeatIds = blockedSeats.map(id => id.toString());
        const unavailableSeatIds = [...new Set([...reservedSeatIds, ...blockedSeatIds])];

        const seatsWithAvailability = allSeats.map(seat => ({
            ...seat.toObject(),
            is_available: !unavailableSeatIds.includes(seat._id.toString())
        }));

        res.json(seatsWithAvailability);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 10. Get all reservations for a specific lab (for the table view)
app.get("/admin/:building_id/laboratory/:lab_id/reservations", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        const reservations = await Reservations.find({
            building_id,
            lab_id,
            status: { $in: ["Ongoing", "Checked"] }
        })
        .sort({date_reserved: -1, reserve_startTime: -1})
        .populate("user_id", "full_name")
        .populate("seat_id", "seat_number");

        res.json(reservations);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});


/* =============== CHECK-IN WINDOW API =============== */

// Called by the admin frontend the FIRST TIME the slot's start time is reached.
// Anchors check_in_deadline to slot_start + 10 minutes — NOT to Date.now() —
// so the window length is consistent regardless of when the admin page opened.
// Idempotent: safe to call multiple times, only writes on the first call.
app.post("/admin/reservation/:reservation_id/start-checkin-window", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        const reservation = await Reservations.findById(req.params.reservation_id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Idempotent: if deadline already stored, return it as-is
        if (reservation.check_in_deadline) {
            return res.json({
                message: "Check-in window already started",
                check_in_deadline: reservation.check_in_deadline
            });
        }

        // Anchor deadline to SLOT START TIME + 10 minutes.
        // Using slot start (not Date.now()) ensures the full 10 minutes is always
        // available from the moment the slot opens, not from when the page loaded.
        const resDate = new Date(reservation.date_reserved);
        const [sh, sm, ss] = reservation.reserve_startTime.split(':').map(Number);
        const slotStart = new Date(resDate);
        slotStart.setHours(sh, sm, ss || 0, 0);

        const deadline = new Date(slotStart.getTime() + 10 * 60 * 1000);

        const updated = await Reservations.findByIdAndUpdate(
            req.params.reservation_id,
            { check_in_deadline: deadline },
            { new: true }
        );

        res.json({
            message: "Check-in window started",
            check_in_deadline: updated.check_in_deadline
        });
    } catch (err) {
        console.error("Error starting check-in window:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ADMIN PROFILE */

/* DELETE ADMIN ACCOUNT */
// This endpoint deletes both the User record and the Admin record
app.delete("/admin/delete/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Find the user first to check if they exist and are an admin
        const user = await Users.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user is an admin (optional: you may want to prevent deleting the last admin)
        if (user.user_type !== "admin") {
            return res.status(403).json({ error: "This endpoint is for deleting admin accounts only." });
        }

        // Delete admin record first (due to foreign key reference)
        const adminDeleted = await Admins.deleteOne({ user_id: user_id });
        
        // Then delete the user
        const userDeleted = await Users.deleteOne({ _id: user_id });

        if (userDeleted.deletedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ 
            message: "Admin account deleted successfully!",
            details: {
                admin_deleted: adminDeleted.deletedCount > 0,
                user_deleted: userDeleted.deletedCount > 0
            }
        });
    } catch (err) {
        console.error("Error deleting admin account:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Login API - checks if user exists and has admin role
app.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email not found" });
        }

        // Check if user is an admin
        if (user.user_type !== "admin") {
            return res.status(403).json({ message: "Access denied. This account does not have admin privileges." });
        }

        // Verify password
        const correctPass = await bcrypt.compare(password, user.user_password);
        if (!correctPass) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        // Verify that admin record exists (should, but just in case)
        const admin = await Admins.findOne({ user_id: user._id });
        if (!admin) {
            return res.status(403).json({ message: "Admin record not found. Please contact system administrator." });
        }

        req.session.user = user;

        res.json({
            message: "Admin login successful!",
            user_type: user.user_type,
            user_id: user._id,
            full_name: user.full_name,
            email: user.email
        });
            
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get Admin Profile
app.get("/admin/profile/:user_id", async (req, res) => {
    try {
        const user_id = req.params.user_id;

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await Users.findById(user_id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify user is admin
        if (user.user_type !== "admin") {
            return res.status(403).json({ error: "Access denied. Not an admin account." });
        }

        const admin = await Admins.findOne({ user_id: user_id });

        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            user_type: user.user_type
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* ADD LAB TECHNICIAN PAGE */

// Add Lab Technician (Admin only)
app.post("/admin/add-lab-technician", async (req, res) => {
    try {
        const { first_name, middle_name, last_name, email, password } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: "Please fill all required fields!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // Check if user already exists
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create full name
        const fullName = middle_name 
            ? `${first_name} ${middle_name} ${last_name}`
            : `${first_name} ${last_name}`;

        // Create new user with admin role
        const newUser = new Users({
            user_type: "admin",
            email: email,
            user_password: hashedPassword,
            full_name: fullName
        });

        const savedUser = await newUser.save();

        // Create admin record
        const newAdmin = new Admins({
            user_id: savedUser._id
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Lab Technician added successfully!",
            user: {
                _id: savedUser._id,
                full_name: savedUser.full_name,
                email: savedUser.email
            }
        });

    } catch (err) {
        console.error("Error adding lab technician:", err);
        res.status(500).json({ message: err.message });
    }
});

/* ADMIN LOGOUT */
app.post("/admin-logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
    });
});


/* EDIT A RESERVATION (user side)
 * Allows the user to change:
 *   - seat(s)          → seat_ids  (array of ObjectId strings)
 *   - time slot        → reserve_startTime, reserve_endTime
 *   - anonymous flag   → is_anonymous
 *
 * Rules enforced:
 *   1. Reservation must be Ongoing
 *   2. The original slot must NOT have started yet (original start >= now)
 *   3. The NEW slot's start time must not have already passed
 *      (i.e. you cannot move to a slot that has already started)
 *   4. New seats must be available for the new time slot on the same date
 *   5. New seats must not be blocked
 *
 * Removed rule (was rule 3 before):
 *   - "New slot must be strictly AFTER the original slot" — REMOVED.
 *     Users can now pick any slot (earlier or later) as long as
 *     that slot's start time hasn't passed yet in Manila time.
 */
app.put("/user/reservation-history/:reservation_id/edit", async (req, res) => {
    try {
        const { reservation_id } = req.params;
        const { seat_ids, reserve_startTime, reserve_endTime, is_anonymous } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        // ── Fetch the existing reservation ──────────────────────────────────
        const reservation = await Reservations.findById(reservation_id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        if (reservation.status !== "Ongoing") {
            return res.status(400).json({ error: "Only ongoing reservations can be edited" });
        }

        // ── Get current Manila time ──────────────────────────────────────────
        const manilaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        const currentTimeStr =
            manilaNow.getHours().toString().padStart(2, '0') + ':' +
            manilaNow.getMinutes().toString().padStart(2, '0') + ':' +
            manilaNow.getSeconds().toString().padStart(2, '0');
        const manilaToday = manilaNow.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        const reservDateManila = new Date(reservation.date_reserved)
            .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        // ── Guard 1: original slot must not have started yet ─────────────────
        // The user cannot edit a reservation once their current slot has begun.
        const originalSlotStarted =
            reservDateManila < manilaToday ||
            (reservDateManila === manilaToday && currentTimeStr >= reservation.reserve_startTime);

        if (originalSlotStarted) {
            return res.status(400).json({
                error: "Your reservation's time slot has already started. Editing is no longer allowed."
            });
        }

        // ── Validate new time slot fields ────────────────────────────────────
        if (!reserve_startTime || !reserve_endTime) {
            return res.status(400).json({ error: "reserve_startTime and reserve_endTime are required" });
        }

        if (reserve_endTime <= reserve_startTime) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        // ── Guard 2: new slot's START time must not have already passed ───────
        // If the reservation is today and the chosen new slot has already started,
        // block it — the user can't check in to a slot that's already underway.
        const newSlotAlreadyStarted =
            reservDateManila === manilaToday && currentTimeStr >= reserve_startTime;

        if (newSlotAlreadyStarted) {
            return res.status(400).json({
                error: "The selected time slot has already started. Please choose a slot that hasn't begun yet."
            });
        }

        // ── Validate new seats ───────────────────────────────────────────────
        if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
            return res.status(400).json({ error: "seat_ids must be a non-empty array" });
        }

        const validSeatIds = seat_ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validSeatIds.length !== seat_ids.length) {
            return res.status(400).json({ error: "One or more seat IDs are invalid" });
        }

        const newSeatObjectIds = validSeatIds.map(id => new mongoose.Types.ObjectId(id));

        // Verify seats belong to the same lab/building
        const newSeats = await Seats.find({
            _id: { $in: newSeatObjectIds },
            building_id: reservation.building_id,
            lab_id: reservation.lab_id
        });

        if (newSeats.length !== newSeatObjectIds.length) {
            return res.status(404).json({ error: "One or more seats not found in this laboratory" });
        }

        // Check for closed seats
        const closedSeat = newSeats.find(s => s.status === "Closed");
        if (closedSeat) {
            return res.status(400).json({ error: `Seat ${closedSeat.seat_number} is currently closed` });
        }

        // Check for conflicts with OTHER reservations in the new time slot
        // (exclude the current reservation itself from the conflict check)
        const seatConflict = await Reservations.findOne({
            building_id: reservation.building_id,
            lab_id: reservation.lab_id,
            seat_id: { $in: newSeatObjectIds },
            date_reserved: reservation.date_reserved,
            status: { $in: ["Ongoing", "Checked"] },
            reserve_startTime: { $lt: reserve_endTime },
            reserve_endTime: { $gt: reserve_startTime },
            _id: { $ne: reservation._id }
        });

        if (seatConflict) {
            return res.status(400).json({
                error: "One or more of the selected seats are already reserved for that time slot"
            });
        }

        // Check for blocked slots
        const blockConflict = await Restricted_Slots.findOne({
            seat_id: { $in: newSeatObjectIds },
            restricted_date: reservation.date_reserved,
            start_time: { $lt: reserve_endTime },
            end_time: { $gt: reserve_startTime }
        });

        if (blockConflict) {
            return res.status(400).json({
                error: "One or more of the selected seats are blocked during this time slot"
            });
        }

        // ── Apply updates ────────────────────────────────────────────────────
        const oldSeatIds = reservation.seat_id;

        const updates = {
            seat_id: newSeatObjectIds,
            reserve_startTime,
            reserve_endTime,
        };

        if (typeof is_anonymous === 'boolean') {
            updates.is_anonymous = is_anonymous;
        }

        const updatedReservation = await Reservations.findByIdAndUpdate(
            reservation_id,
            updates,
            { new: true, runValidators: true }
        );

        // Update seat statuses: released seats → Available, new seats → Occupied
        const oldSeatStrings = oldSeatIds.map(id => id.toString());
        const newSeatStrings = newSeatObjectIds.map(id => id.toString());

        const removedSeats = oldSeatStrings.filter(id => !newSeatStrings.includes(id));
        const addedSeats   = newSeatStrings.filter(id => !oldSeatStrings.includes(id));

        if (removedSeats.length > 0) {
            for (const seatId of removedSeats) {
                const stillActive = await Reservations.findOne({
                    seat_id: seatId,
                    status: { $in: ["Ongoing", "Checked"] },
                    _id: { $ne: reservation_id }
                });
                if (!stillActive) {
                    await Seats.findByIdAndUpdate(seatId, { status: "Available" });
                }
            }
        }

        if (addedSeats.length > 0) {
            await Seats.updateMany(
                { _id: { $in: addedSeats } },
                { status: "Occupied" }
            );
        }

        res.json({
            message: "Reservation updated successfully",
            reservation_id: updatedReservation._id,
            reserve_startTime: updatedReservation.reserve_startTime,
            reserve_endTime: updatedReservation.reserve_endTime,
            is_anonymous: updatedReservation.is_anonymous
        });

    } catch (err) {
        console.error("Error editing reservation:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "This reservation already exists for the chosen time and seat." });
        }
        res.status(500).json({ error: err.message });
    }
});

// Connect server to port
app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});