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

        // Update user collection
        const updatedUser = await Users.findByIdAndUpdate(
            user_id,
            { full_name },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update student collection
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

        // Verify current password
        const correctPass = await bcrypt.compare(currentPassword, user.user_password);
        if (!correctPass) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
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

        const seatConflict = await Reservations.findOne({
            lab_id, 
            date_reserved: new Date(reserve_date),
            reserve_startTime,
            reserve_endTime,
            status: "Ongoing",
            seat_id: { $in: seat_id }
        });

        if(seatConflict) {
            return res.status(400).json({ error: "The seat(s) you chose are already taken." });
        }

        const newReservation = new Reservations({
            user_id: user._id,
            building_id,
            lab_id,
            seat_id, 
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
            .populate("seat_id")
            .sort({ date_reserved: -1 });

        res.json(reservations);
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

/* CHECK IN A RESERVATION */
app.post("/user/reservation-history/:reservation_id/check-in", async (req, res) => {
    try{
        if(!mongoose.Types.ObjectId.isValid(req.params.reservation_id)) {
            return res.status(400).json({ error: "Invalid reservation ID" });
        }

        const confirmReservation = await Reservations.findByIdAndUpdate(
            req.params.reservation_id,
            { status: "Ongoing" },
            { new: true }
        ); 

        if(!confirmReservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json({ message: "Reservation has been confirmed successfully!" });
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


/* USER ADVANCED SEARCH */
app.post("/user/advanced-search", async (req, res) => {

    try {
        //technically building id and lab id here is the code (e.g, GK, GK201)
    const { searchDate, timeSlot, showOnlyAvailable, buildingID, labID} = req.body;

    //split the start time and end time string to align with reservation schema

    let startTime = "00:00";
    let endTime = "23:59";

    if(timeSlot) {
        [startTime, endTime] = timeSlot.split("-").map(t => t.trim());
    }

    //build query to find the id given the data from front end 
    const query = { date_reserved: new Date(searchDate) };

    //for buildingID and labID, im assuming the ones the front end are sending is the code not the ID itself from mongo
    //get building id based from building code
    //note buildingID = building_code
    if(buildingID && buildingID != "ALL") {
        const building = await Building.findOne({ building_code: buildingID} );

        if(building) {
            query.building_id = building._id;
        }
    }

    //get lab id based from lab code
    //note labID = lab_code
    if(labID && labID != "ALL") {
        const lab = await Laboratory.findOne({ room_code: labID});

        if(lab) {
            query.lab_id = lab._id;
        }
    }

    let labFilter = {};

    if(query.building_id) {
        labFilter.building_id = query.building_id;
    }

    if(query.lab_id) {
        labFilter._id= query.lab_id;
    }

    const labs = await Laboratory.find(labFilter).populate("building_id"); //array of lab documents from mongoDB


    //get the reservations given the date
    const reservations = await Reservation.find(query);

    //get only the reservations based on the selected timeslot 
    const selectedTimeReservations = reservations.filter(r =>
        !(r.reserve_endTime <= startTime || r.reserve_startTime >= endTime)
    );

    //compute for the available seats per lab
    const results = [];
    
    for(const lab of labs) {
        //for each lab, find the reservations of this lab within the selected time slot
        const reservationsForLab = [];
        for(const reservation of selectedTimeReservations) {
            if(reservation.lab_id.toString() === lab._id.toString()) {
                reservationsForLab.push(reservation);
            }
        }

        //for each lab, get total reserved seats through reservations
        let reservedSeats = 0;
        for(const reservation of reservationsForLab) {
            reservedSeats += reservation.seat_id.length; //because seat_id in reservation is an array of seats
        }                                                //hence, count how many seats in that id

        //now, compute for available seats left
        const availableSeats = lab.capacity - reservedSeats;
        const status = availableSeats > 0 ? "Available" : "Full";

        //finally build the result needed
        const labResult = {
            id: lab._id,
            building: lab.building_id.building_code,
            laboratory: lab.room_code,
            date: searchDate,
            time: timeSlot,
            availableSeats,
            status
        };
        results.push(labResult);
    }

    //filter the result based on if the user checks the "only available seats"
    const finalResults = showOnlyAvailable ? results.filter(lab => lab.status === "Available") : results;

    res.json(finalResults);

    }
    catch (err) {
        res.status(500).json({error: err.message});
    }
});

/* VIEW OTHER PROFILE */
app.get("/user/profile/:user_id", async (req, res) => {

    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.user_id)){
            return res.status(400).json({ error: "User not found" });
        }
    
        //get user through user id
        const user = await User.findById(req.params.user_id);
        
        //we need attributes of student 
        const student = await Student.findOne({ user_id: req.params.user_id });

        //now get reservation given user id
        const reservations = await Reservation.find({ user_id: req.params.user_id })
            .populate("building_id")
            .populate("lab_id")
            .populate("seat_id");

        //format the needed data from the frontend jsx 
        const resultReservation = reservations.map(r => ({
            building: r.building_id.building_name,
            room: r.lab_id.room_code,
            seat: r.seat_id.map(s => s.seat_number).join(", "),
            date: r.date_reserved.toString(),
            time: r.reserve_startTime + " - " + r.reserve_endTime,
            status: r.status
        }))

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

/* DELETE USER  */
app.delete("/user/view-profile/:user_id/delete_user", async (req, res) => {
    try{
         if (!mongoose.Types.ObjectId.isValid(req.params.user_id)){
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const user = await User.findByID(req.params.user_id);
        if(!user) {
            return res.status(404).json({ error: "Could not find specified user "});
        }

        //delete from student model
        await Student.deleteOne({ user_id: req.params.user_id });

        //delete from user model
        await User.deleteOne({ _id: req.params.user_id});

        res.json({ message: "User has been deleted successfully!"})

    }
    catch(err) {
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
// for reserving available seats (seat_numbers is now an array)
app.post("/admin/:building_id/laboratory/:lab_id/reserve_seat", async (req,res) => {
    try {
        const { building_id, lab_id } = req.params;
        const { seat_numbers, name, email, date_reserved, reserve_startTime, reserve_endTime } = req.body;

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

        if (!seat_numbers || !Array.isArray(seat_numbers) || seat_numbers.length === 0) {
            return res.status(400).json({ error: "seat_numbers must be a non-empty array" });
        }

        // End time cannot be earlier than start time
        if (reserve_endTime <= reserve_startTime) {
            return res.status(400).json({ error: "End time must be after start time" });
        }

        // Find user using email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find all seats using seat numbers
        const seats = await Seats.find({ seat_number: { $in: seat_numbers }, lab_id, building_id });
        if (!seats || seats.length !== seat_numbers.length) {
            return res.status(404).json({ error: "One or more seats not found" });
        }

        const seatIds = seats.map(s => s._id);

        // Check conflict: any of the seats already reserved in overlapping time
        const conflict = await Reservations.findOne({
            seat_id: { $in: seatIds },
            date_reserved: new Date(date_reserved),
            status: "Ongoing",
            reserve_startTime: { $lt: reserve_endTime },
            reserve_endTime: { $gt: reserve_startTime }
        });

        if (conflict) {
            return res.status(400).json({ error: "One or more seats already reserved for that time range" });
        }

        // Check if any seat is blocked during this time
        const blockConflict = await Restricted_Slots.findOne({
            seat_id: { $in: seatIds },
            restricted_date: new Date(date_reserved),
            start_time: { $lt: reserve_endTime },
            end_time: { $gt: reserve_startTime }
        });

        if (blockConflict) {
            return res.status(400).json({ error: "One or more seats are blocked during this time" });
        }

        // Create the reservation with array of seat_ids
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

        // Update all seats to "Occupied"
        await Seats.updateMany(
            { _id: { $in: seatIds } },
            { seat_status: "Occupied" }
        );

        res.status(201).json({
            message: "Reservation created successfully",
            reservation,
            seats
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

        // Check if there's an existing reservation during this blocked time
        // seat_id is now an array, use $elemMatch or $in
        const existingReservation = await Reservations.findOne({
            seat_id: { $in: [seat._id] },
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

        // seat_id is now an array, use $in to find reservation containing this seat
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: "Ongoing"
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
            // seat_id is now an array of populated objects
            seat_numbers: reservation.seat_id.map(s => s.seat_number),
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
            email, 
            seat_numbers,
            date_reserved, 
            start_time, 
            end_time 
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(building_id)) {
            return res.status(400).json({ error: "Invalid building ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(lab_id)) {
            return res.status(400).json({ error: "Invalid laboratory ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(seat_id)) {
            return res.status(400).json({ error: "Invalid seat ID" });
        }

        // Find reservation that contains this seat_id in its array
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: "Ongoing"
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

        // Handle seat_numbers array change
        if (seat_numbers) {
            if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
                return res.status(400).json({ error: "seat_numbers must be a non-empty array" });
            }

            const newSeats = await Seats.find({ seat_number: { $in: seat_numbers }, lab_id, building_id });
            if (!newSeats || newSeats.length !== seat_numbers.length) {
                return res.status(404).json({ error: "One or more seats not found in this laboratory" });
            }

            // Check all new seats are not Closed
            const closedSeat = newSeats.find(s => s.seat_status === "Closed");
            if (closedSeat) {
                return res.status(400).json({ 
                    error: `Seat ${closedSeat.seat_number} is currently Closed` 
                });
            }

            newSeatIds = newSeats.map(s => s._id);

            // Check conflicts for new seats (excluding current reservation)
            const conflictingReservation = await Reservations.findOne({
                building_id,
                lab_id,
                seat_id: { $in: newSeatIds },
                date_reserved: date_reserved ? new Date(date_reserved) : reservation.date_reserved,
                reserve_startTime: { $lt: end_time || reservation.reserve_endTime },
                reserve_endTime: { $gt: start_time || reservation.reserve_startTime },
                status: "Ongoing",
                _id: { $ne: reservation._id }
            });

            if (conflictingReservation) {
                return res.status(400).json({ 
                    error: "One or more seats are already reserved for the specified time slot" 
                });
            }

            // Check if any new seat is blocked during this time
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
                seat_numbers: populatedReservation.seat_id.map(s => s.seat_number),
                laboratory: populatedReservation.lab_id.lab_name,
                room_code: populatedReservation.lab_id.room_code,
                building: populatedReservation.building_id.building_name,
                date_reserved: populatedReservation.date_reserved,
                start_time: populatedReservation.reserve_startTime,
                end_time: populatedReservation.reserve_endTime
            });
        }

        // Check for time/date conflicts on existing seats (if only time/date changed, not seats)
        if ((date_reserved || start_time || end_time) && !seat_numbers) {
            const conflictQuery = {
                building_id,
                lab_id,
                seat_id: { $in: oldSeatIds },
                date_reserved: updates.date_reserved || reservation.date_reserved,
                reserve_startTime: { $lt: updates.reserve_endTime || reservation.reserve_endTime },
                reserve_endTime: { $gt: updates.reserve_startTime || reservation.reserve_startTime },
                status: "Ongoing",
                _id: { $ne: reservation._id }
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

        // If seats changed, free old seats and occupy new seats
        if (seatsChanged && newSeatIds) {
            await Seats.updateMany({ _id: { $in: oldSeatIds } }, { seat_status: "Available" });
            await Seats.updateMany({ _id: { $in: newSeatIds } }, { seat_status: "Occupied" });
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

// 8. /admin/:building_id/laboratory/:lab_id/remove_reservation/:seat_id
// removing the reservation
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

        // seat_id is now an array, use $in to find reservation containing this seat
        const reservation = await Reservations.findOne({
            building_id,
            lab_id,
            seat_id: { $in: [seat_id] },
            status: "Ongoing"
        });

        if (!reservation) {
            return res.status(404).json({ error: "No active reservation found for this seat" });
        }

        const allSeatIds = reservation.seat_id;

        // Soft-delete: set status to Cancelled
        await Reservations.findByIdAndUpdate(
            reservation._id,
            { status: "Cancelled" },
            { new: true }
        );

        // Free all seats that were part of this reservation
        await Seats.updateMany(
            { _id: { $in: allSeatIds } },
            { seat_status: "Available" }
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

        const allSeats = await Seats.find({ building_id, lab_id });

        if (!allSeats || allSeats.length === 0) {
            return res.status(404).json({ error: "No seats found in this laboratory" });
        }

        if (!date || !start_time || !end_time) {
            return res.json(allSeats);
        }

        // seat_id is now an array; use $elemMatch or unwind via aggregation
        // distinct on array fields returns individual elements, so $in still works here
        const reservationsWithConflict = await Reservations.find({
            building_id,
            lab_id,
            date_reserved: new Date(date),
            status: "Ongoing",
            reserve_startTime: { $lt: end_time },
            reserve_endTime: { $gt: start_time }
        }).select("seat_id");

        // Flatten the arrays of seat_ids from all conflicting reservations
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
        .populate("user_id", "full_name")
        .populate("seat_id", "seat_number");

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
