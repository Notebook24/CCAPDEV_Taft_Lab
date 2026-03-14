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
const Existing_Classes = require("../models/existing_class");
const Class_Schedules = require("../models/class_schedule");
const Buildings = require("../models/building");
const Admins = require("../models/admin");
const Laboratory = require("../models/laboratory");

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
        secret: "secret-key",
        resave: "false",
        saveUninitialized: false
    })
);

/*=== CONFIGURATION FOR APP TO USE SESSION ===*/
app.use(cookieParser());



/*=== PLACE ALL APIs HERE BELOW ===*/

/* =============== USER SIDE APIs =============== */

/* Sign up a user */
app.post("/signup", async(req, res) => {
    const userData = {
        fn: req.body.first_name,
        mn: req.body.middle_name,
        ln: req.body.last_name,
        email: req.body.email_address,
        pw: req.body.password, 
        st: req.body.student_type,  
        dep: req.body.department   
    };

    //validate user input
    if(!userData.fn || !userData.mn || !userData.ln || !userData.email || !userData.pw || !userData.st || !userData.dep) {
        return res.status(400).json({ message: "Please fill all the fields! "})
    }

    //check if email (user) already exists
    const existingUser = await Users.findOne({email: userData.email});
    if(existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    //hash the password for security 
    const hashedUserPW = await bcrypt.hash(userData.pw, 10);

    //if no errors, create new user
    const newUser = new Users({
        user_type: "student",
        email: userData.email,
        user_password: hashedUserPW,
        full_name: userData.fn + " " + userData.mn + " " + userData.ln
    });

    //add to user table and save this to a variable so we can get user id later
    //to be also saved to student table

    const savedUser = await newUser.save();

    //create student record too
    const newStudent = new Students({
        user_id: savedUser._id,
        student_type: userData.st,
        department: userData.dep
    });

    //add to student table
    await newStudent.save();

    res.status(201).json({
        message: "User registered successfully!"
    })
});

/* USER LOGIN */
app.post ("/login", async(req, res) => {
    const {email, password} = req.body; //get encoded email and pass from login form
    console.log("CLICKED")
    try {
        //find the user by email in db
        const user = await Users.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: "Email not found" });
        }

        //check password
        const correctPass = await bcrypt.compare(password, user.user_password);
        if(!correctPass) {
             return res.status(400).json({ message: "Incorrect password" });
        }

        //save user info to a session (INCLUDING ADMIN)
        req.session.user = user;

        //check what kind of user and redirect accordingly
        res.json({
            message: "Login successful!",
            user_type: user.user_type
        })
            
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

/* RESERVATION PAGE AFTER HOMEPAGE */
//this is for fetching buildings 
app.get("/user/reservation", async (req, res) => {
    try {
        //given building id from url, use it to get id of building from the db
        if (!mongoose.Types.ObjectId.isValid(req.query.building_id)){ //double check this line w/ others 
            return res.status(400).json({ message: "Invalid building ID" }); //are buildings (building_id) pre made in db?
        }                                                              //will i get building id from query or from url param

        const building = await Buildings.findOne({building_id: req.query.building_id});

        if(!building)
            return res.status(404).json({ message: "Building not found"})

        res.json(building);
    }
    catch (err) {
        console.error(err);
         res.status(500).json({ message: err.message});
    }
});

/* USER RESERVATION PAGE */
app.get("/user/reservation/:building_id", async (req, res) => {
    try {
        const date = req.params.date;
        
        if(!mongoose.Types.ObjectId.isValid(req.params.building_id)) {
            return res.status(400).json( {error: "Invalid Building ID"});
        }

        //get the labs given the building id from url
        const laboratories = await Laboratory.find({ building_id: req.params.building_id});

        //for each lab, get the reservations
        const result = await Promise.all(laboratories.map(async lab => {
            const reservations = await Reservation.find({ 
                lab_id: lab._id, 
                date_reserved: new Date(date)
            });
            return {
                room: lab.room_code,
                capacity: lab.capacity,
                reservations
            };
        }));

        res.json({result});
        
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});




/* =============== ADMIN SIDE APIs =============== */


/* ADMIN HOME PAGE */

// /admin
// for retrieving buildings from the database
app.get("/admin", async (req,res) => {
    try {
        const buildings = await Buildings.find();
        res.json(buildings);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

/* ADMIN BUILDING DASHBOARD */
// 1. /admin/:id/laboratories
// for getting all laboratories from a specific building
// In addition to laboratories attributes, you can also get the number of reservations 
// in each lab with "reservation_count"
app.get("/admin/:building_id/laboratories", async (req,res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.building_id)){
            return res.status(400).json({ error: "Invalid building ID" });
        }
        const laboratories = await Laboratories.find({building_id: req.params.building_id});

        const result = await Promise.all(
            laboratories.map(async (lab) => {
                const count = await Reservations.countDocuments({lab_id: lab._id, status: "Ongoing"});

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

// 2. /admin/:id/laboratories/reservations
// for retrieving reservations (to be separated in the frontend)
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

// 3. /admin/:id/laboratories/recent_students
// for retrieving the 5 latest students who reserved in a specific building
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

// 4. /admin/:building_id/
// get specific Building
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

// 1. /admin/:building_id/laboratory/:lab_id
// for getting the specific room in a specific building
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
            return res.status(404).json({ 
                error: "Laboratory not found in this building" 
            });
        }
        res.json(laboratory);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 2. /admin/:building_id/laboratory/:lab_id/seats
// for getting all the seats in a specific laboratory, in a specific building
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
            return res.status(404).json({ 
                error: "Seats not found in this laboratory and building" 
            });
        }
        res.json(seats)
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 3. /admin/:building_id/laboratory/:lab_id/reserve_seat
// for reserving available seats
app.post("/admin/:building_id/laboratory/:lab_id/reserve_seat", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { seat_number, name, email, date_reserved, reserve_startTime, reserve_endTime } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }

        // Validation of inputs (must be complete)
        if (!name || !email || !date_reserved || !reserve_startTime || !reserve_endTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // End time cannot be earlier than start time
        if (reserve_endTime <= reserve_startTime) {
            return res.status(400).json({
                error: "End time must be after start time"
            });
        }

        // Find user using email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Find seat using seat number
        const seat = await Seats.findOne({ seat_number, lab_id, building_id });
        if (!seat) {
            return res.status(404).json({
                error: "Seat not found"
            });
        }

        // See if the start time of the reservation is within an ongoing reservation of another user
        const conflict = await Reservations.findOne({
            seat_id: seat._id,
            date_reserved: new Date(date_reserved),
            status: "Ongoing",
            reserve_startTime: { $lt: reserve_endTime },
            reserve_endTime: { $gt: reserve_startTime }
        });

        if (conflict) {
            return res.status(400).json({
                error: "Seat already reserved for that time range"
            });
        }

        // See if start time of reservation is within the closing time of a seat
        const blockConflict = await Restricted_Slots.findOne({
            seat_id: seat._id,
            restricted_date: new Date(date_reserved),
            start_time: { $lt: reserve_endTime },
            end_time: { $gt: reserve_startTime }
        });

        if (blockConflict) {
            return res.status(400).json({
                error: "Seat is blocked during this time"
            });
        }

        // Create the reservation
        const reservation = await Reservations.create({
            user_id: user._id,
            building_id,
            lab_id,
            seat_id: seat._id,
            date_reserved: new Date(date_reserved),
            reserve_startTime,
            reserve_endTime,
            status: "Ongoing"
        });

        // Update the seat to be "Occupied"
        const updatedSeat = await Seats.findByIdAndUpdate(
            seat._id,
            { seat_status: "Occupied" },
            { new: true, runValidators: true }
        );

        if (!updatedSeat) {
            return res.status(404).json({ error: "Seat not found" });
        }

        res.status(201).json({
            message: "Reservation created successfully",
            reservation,
            seat: updatedSeat
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 4. /admin/:building_id/laboratory/:lab_id/block_seat
// blocking reservations for a seat
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

        // Validation of inputs (must be complete)
        if (!seat_number || !restricted_date || !start_time || !end_time) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // End time cannot be earlier than start time
        if (end_time <= start_time) {
            return res.status(400).json({
                error: "End time must be after start time"
            });
        }

        // Find seat using seat number
        const seat = await Seats.findOne({ seat_number, lab_id, building_id });
        if (!seat) {
            return res.status(404).json({
                error: "Seat not found"
            });
        }

        // Check if there's an existing reservation during this blocked time
        const existingReservation = await Reservations.findOne({
            seat_id: seat._id,
            date_reserved: new Date(restricted_date),
            status: "Ongoing",
            reserve_startTime: { $lt: end_time },
            reserve_endTime: { $gt: start_time }
        });

        if (existingReservation) {
            return res.status(400).json({
                error: "Cannot block seat - there is an existing reservation during this time"
            });
        }

        // Check if seat is already blocked for this time
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

        // Create restricted slot
        const restricted_slot = await Restricted_Slots.create({
            building_id,
            lab_id,
            seat_id: seat._id,
            restricted_date: new Date(restricted_date),
            start_time,
            end_time
        });

        // Update the seat to be "Closed"
        const updatedSeat = await Seats.findByIdAndUpdate(
            seat._id,
            { seat_status: "Closed" },
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

// 5. /admin/:building_id/laboratory/:lab_id/unblock_seat
// unblocking reservations for a seat
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

        // Validation of inputs (must be complete)
        if (!seat_number) {
            return res.status(400).json({ error: "Seat number is required" });
        }

        // Find seat using seat number
        const seat = await Seats.findOne({ seat_number, lab_id, building_id });
        if (!seat) {
            return res.status(404).json({
                error: "Seat not found"
            });
        }

        // Find and delete all restricted slots for this seat
        const deleted = await Restricted_Slots.deleteMany({
            seat_id: seat._id,
            lab_id,
            building_id
        });

        if (deleted.deletedCount === 0) {
            return res.status(404).json({
                error: "No restricted slots found for this seat"
            });
        }

        // Update the seat status back to "Available"
        const updatedSeat = await Seats.findByIdAndUpdate(
            seat._id,
            { seat_status: "Available" },
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

// 6. /admin/:building_id/laboratory/:lab_id/view_details/:seat_id
// viewing the details of the reservation
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

        // Get the reservation, along with other details of the user, laboratory, building, and seat
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id,
            status: "Ongoing"
        })
        .populate("user_id", "full_name email")
        .populate("seat_id", "seat_number")
        .populate("lab_id", "lab_name room_code")
        .populate("building_id", "building_name");

        if (!reservation) {
            return res.status(404).json({
                error: "No active reservation for this seat"
            });
        }

        res.json({
            full_name: reservation.user_id.full_name,
            email: reservation.user_id.email,
            seat_number: reservation.seat_id.seat_number,
            laboratory: reservation.lab_id.lab_name,
            room_code: reservation.lab_id.room_code,
            building: reservation.building_id.building_name,
            date_reserved: reservation.date_reserved,
            start_time: reservation.reserve_startTime,
            end_time: reservation.reserve_endTime,
            reservation_id: reservation._id
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 7. /admin/:building_id/laboratory/:lab_id/edit_reservation/:seat_id
// editing the details of the reservation
app.put("/admin/:building_id/laboratory/:lab_id/edit_reservation/:seat_id", async (req, res) => {
    try {
        const { building_id, lab_id, seat_id } = req.params;
        const { 
            full_name, 
            email, 
            seat_number, 
            room_code, 
            building_name, 
            date_reserved, 
            start_time, 
            end_time 
        } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        // Get the current reservation
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id,
            status: "Ongoing"
        });

        if (!reservation) {
            return res.status(404).json({
                error: "No active reservation for this seat"
            });
        }

        // Check if any updatable fields are provided
        const updates = {};
        let seatChanged = false;
        let newSeatId = null;

        // Validate and prepare updates for allowed fields
        if (date_reserved) {
            const newDate = new Date(date_reserved);
            if (isNaN(newDate.getTime())) {
                return res.status(400).json({ error: "Invalid date format" });
            }
            updates.date_reserved = newDate;
        }

        if (start_time) {
            // Validate time format (HH:MM or HH:MM:SS)
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(start_time)) {
                return res.status(400).json({ error: "Invalid start time format. Use HH:MM or HH:MM:SS" });
            }
            updates.reserve_startTime = start_time;
        }

        if (end_time) {
            // Validate time format (HH:MM or HH:MM:SS)
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(end_time)) {
                return res.status(400).json({ error: "Invalid end time format. Use HH:MM or HH:MM:SS" });
            }
            updates.reserve_endTime = end_time;
        }

        // If both start and end times are provided, validate they don't conflict
        if ((start_time || end_time) && !seat_number) {
            const newStartTime = start_time || reservation.reserve_startTime;
            const newEndTime = end_time || reservation.reserve_endTime;
            
            if (newEndTime <= newStartTime) {
                return res.status(400).json({
                    error: "End time must be after start time"
                });
            }
        }

        // Handle seat number change (finding new seat_id)
        if (seat_number) {
            // Find the new seat based on seat_number, building_id, and lab_id
            const newSeat = await Seats.findOne({
                building_id,
                lab_id,
                seat_number: seat_number
            });

            if (!newSeat) {
                return res.status(404).json({ 
                    error: `Seat with number ${seat_number} not found in this laboratory` 
                });
            }

            // Check if the new seat is available (using seat_status)
            if (newSeat.seat_status !== "Available" && newSeat.seat_status !== "Occupied") {
                return res.status(400).json({ 
                    error: `Selected seat ${seat_number} is currently ${newSeat.seat_status}` 
                });
            }

            // Check if the new seat has any conflicting reservations
            const conflictingReservation = await Reservations.findOne({
                building_id,
                lab_id,
                seat_id: newSeat._id,
                date_reserved: date_reserved ? new Date(date_reserved) : reservation.date_reserved,
                reserve_startTime: start_time || reservation.reserve_startTime,
                reserve_endTime: end_time || reservation.reserve_endTime,
                status: "Ongoing",
                _id: { $ne: reservation._id } // Exclude current reservation
            });

            if (conflictingReservation) {
                return res.status(400).json({ 
                    error: `Seat ${seat_number} is already reserved for the specified time slot` 
                });
            }

            // Check if the new seat is blocked during this time
            const blockConflict = await Restricted_Slots.findOne({
                seat_id: newSeat._id,
                restricted_date: date_reserved ? new Date(date_reserved) : reservation.date_reserved,
                start_time: { $lt: end_time || reservation.reserve_endTime },
                end_time: { $gt: start_time || reservation.reserve_startTime }
            });

            if (blockConflict) {
                return res.status(400).json({
                    error: `Seat ${seat_number} is blocked during this time`
                });
            }

            updates.seat_id = newSeat._id;
            seatChanged = true;
            newSeatId = newSeat._id;
        }

        // If no updates provided, return current reservation details
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
                seat_number: populatedReservation.seat_id.seat_number,
                laboratory: populatedReservation.lab_id.lab_name,
                room_code: populatedReservation.lab_id.room_code,
                building: populatedReservation.building_id.building_name,
                date_reserved: populatedReservation.date_reserved,
                start_time: populatedReservation.reserve_startTime,
                end_time: populatedReservation.reserve_endTime
            });
        }

        // Check for conflicts with other reservations (if date/time changed)
        if (date_reserved || start_time || end_time || seat_number) {
            const conflictQuery = {
                building_id,
                lab_id,
                seat_id: updates.seat_id || seat_id,
                date_reserved: updates.date_reserved || reservation.date_reserved,
                reserve_startTime: updates.reserve_startTime || reservation.reserve_startTime,
                reserve_endTime: updates.reserve_endTime || reservation.reserve_endTime,
                status: "Ongoing",
                _id: { $ne: reservation._id } // Exclude current reservation
            };

            const conflictingReservation = await Reservations.findOne(conflictQuery);
            
            if (conflictingReservation) {
                return res.status(400).json({ 
                    error: "The requested changes conflict with an existing reservation" 
                });
            }
        }

        // Update the reservation
        const updatedReservation = await Reservations.findByIdAndUpdate(
            reservation._id,
            updates,
            { new: true, runValidators: true }
        )
        .populate("user_id", "full_name email")
        .populate("seat_id", "seat_number")
        .populate("lab_id", "room_code lab_name")
        .populate("building_id", "building_name");

        // If seat was changed, update the status of old and new seats
        if (seatChanged && newSeatId) {
            // Set old seat to Available
            await Seats.findByIdAndUpdate(seat_id, { seat_status: "Available" });
            // Set new seat to Occupied
            await Seats.findByIdAndUpdate(newSeatId, { seat_status: "Occupied" });
        }

        // Prepare response message
        const updatedFields = [];
        if (date_reserved) updatedFields.push("date");
        if (start_time) updatedFields.push("start time");
        if (end_time) updatedFields.push("end time");
        if (seat_number) updatedFields.push("seat");

        res.json({
            message: `Reservation updated successfully. Changed: ${updatedFields.join(", ")}`,
            full_name: updatedReservation.user_id.full_name,
            email: updatedReservation.user_id.email,
            seat_number: updatedReservation.seat_id.seat_number,
            laboratory: updatedReservation.lab_id.lab_name,
            room_code: updatedReservation.lab_id.room_code,
            building: updatedReservation.building_id.building_name,
            date_reserved: updatedReservation.date_reserved,
            start_time: updatedReservation.reserve_startTime,
            end_time: updatedReservation.reserve_endTime
        });

    } catch (err) {
        // Handle duplicate key error (unique constraint violation)
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: "This combination of user, building, lab, seat, date, and time already exists" 
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// 8. /admin/:building_id/laboratory/:lab_id/remove_reservation/:seat_id
// removing the reservation
app.delete("/admin/:building_id/laboratory/:lab_id/remove_reservation/:seat_id", async (req, res) => {
    try {
        const { building_id, lab_id, seat_id } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        // Find the active reservation for this seat
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id,
            status: "Ongoing"
        });

        if (!reservation) {
            return res.status(404).json({
                error: "No active reservation found for this seat"
            });
        }

        // Set the status of the reservation to "Cancelled", soft-delete
        await Reservations.findByIdAndUpdate(
            reservation._id,
            { status: "Cancelled" },
            { new: true }
        );

        // Update the seat status to "Available"
        await Seats.findByIdAndUpdate(
            seat_id,
            { seat_status: "Available" },
            { new: true, runValidators: true }
        );

        // Get the reservation details before deletion for response
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
                seat_number: cancelledReservationDetails?.seat_id?.seat_number || "N/A",
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

// 9. /admin/:building_id/laboratory/:lab_id/available_seats
// for getting all available seats in a lab for a specific date and time
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

        // Get all seats in the lab
        const allSeats = await Seats.find({
            building_id,
            lab_id
        });

        if (!allSeats || allSeats.length === 0) {
            return res.status(404).json({ error: "No seats found in this laboratory" });
        }

        // If no date/time provided, return all seats with their current status
        if (!date || !start_time || !end_time) {
            return res.json(allSeats);
        }

        // Find reserved seats for this time slot
        const reservedSeats = await Reservations.find({
            building_id,
            lab_id,
            date_reserved: new Date(date),
            status: "Ongoing",
            reserve_startTime: { $lt: end_time },
            reserve_endTime: { $gt: start_time }
        }).distinct('seat_id');

        // Find blocked seats for this time slot
        const blockedSeats = await Restricted_Slots.find({
            building_id,
            lab_id,
            restricted_date: new Date(date),
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        }).distinct('seat_id');

        const unavailableSeats = [...new Set([...reservedSeats, ...blockedSeats])];

        // Mark seats as available or unavailable
        const seatsWithAvailability = allSeats.map(seat => ({
            ...seat.toObject(),
            is_available: !unavailableSeats.includes(seat._id.toString())
        }));

        res.json(seatsWithAvailability);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// 10. /admin/:building_id/laboratory/:lab_id/reservations
// for getting all reservations along with the time slot and name to show on the table
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
            status: "Ongoing"
        })
        .sort({date_reserved: -1, reserve_startTime: -1})
        .populate("user_id", "name")
        .populate("seat_id", "seat_number")

        res.json(reservations);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

// Connect server to port
app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});