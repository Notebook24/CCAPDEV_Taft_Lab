// models/user.js
const mongoose = require('mongoose');
const Student = require("./student");
const Admin = require("./admin");
const Reservation = require('./reservation');

const userSchema = new mongoose.Schema({
    user_type: {
        type: String,
        enum: ["student", "admin"],
        required: true
    },
    email: {
        type: String,
        maxlength: 100,
        required: true,
        unique: true
    },
    user_password: {
        type: String,
        maxlength: 255,
        required: true
    },
    full_name: {
        type: String,
        maxlength: 100,
        required: true
    },
    profile_picture: {
        type: String,
        default: null
    }
});

userSchema.pre("deleteOne", {document: true}, async function(next){
    try{
        const studentDeleted = await Student.deleteOne({user_id: this._id});
        if (studentDeleted.deletedCount === 0) {
            await Admin.deleteOne({user_id: this._id});
        }
        await Reservation.deleteMany({user_id: this._id});
        next();
    } 
    catch (err){
        next(err);
    }
});

const User = new mongoose.model("User", userSchema);
module.exports = User;