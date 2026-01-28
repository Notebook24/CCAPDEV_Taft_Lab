const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    student_type: {
        type: String,
        enum: ["SHS", "UG", "GD"],
        required: true
    },
    department: {
        type: String,
        enum: ["CCS", "COS", "CLA", "BAGCED", "COL", "GCOE", "RVRCOB", "SOE", "Integrated School"],
        required: true
    }
});

const Student = new mongoose.model("Student", studentSchema);
module.exports = Student;