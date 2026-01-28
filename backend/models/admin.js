const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    job_position: {
        type: String,
        maxlength: 30,
        required: true
    }
});

const Admin = new mongoose.model("Admin", adminSchema);
module.exports = Admin;