const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Mentor = require("../models/Mentor");
const Student = require("../models/Student");
const Meeting = require("../models/Meeting");
const Post = require("../models/Post");
const Log = require("../models/Log");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs")

// importing utils
const response = require("../utils/responses.utils");

// importing helpers methods
const studentHelpers = require("../helpers/student.helper");
const mentorHelpers = require("../helpers/mentor.helper");

// env config
dotenv.config();

/**
 * This module consists of all the handler function for the admin route
 */

module.exports = {
    /** Admin Login Handler */
    adminLoginHandler: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                // if email/pass does not exists
                return response.badrequest(res, "Please provide valid email/password", {});
            }

            const admin = await Admin.findByCredentials(email, password);
            const token = await admin.generateAuthToken();
            response.success(res, "Login successful", { auth_token: token, role: "ADMIN" });

            req.user = admin;
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // admin dashboard handler function
    adminDashboardHandler: (req, res, next) => {
        response.success(res, "", { user: req.user });
        next();
    },

    // this route handler returns the list of all users i.e, all mentors and students
    getAllUsers: async (req, res, next) => {
        const students = await studentHelpers.getAllStudents();
        const mentors = await mentorHelpers.getAllMentors();
        response.success(res, "", { mentors, students });
        next();
    },

    // DEPRECATED: Manual allocation functions removed in favor of student-initiated requests
    // /**
    //  *  saveGroup route saves the mentor and students group.
    //  *  We store the mentor's id in every student's property named "mentordBy" , to establish a link
    //  *  between a mentor and the students mentored by him.
    //  *
    //  * Add/Update and unassigned students operations are in this route
    //  * */
    // saveGroup: async (req, res, next) => { ... },
    // assignMentees: async (req, res, next) => { ... },
    // removeMentees: async (req, res, next) => { ... },

    // get admin profile
    getProfile: async (req, res, next) => {
        try {
            const admin = req.user;
            response.success(res, "", admin);
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // update Profile
    updateProfile: async (req, res, next) => {
        try {
            const { firstname, middlename, lastname } = req.body;
            const admin = req.user;

            admin.firstname = firstname || admin.firstname;
            admin.middlename = middlename || admin.middlename;
            admin.lastname = lastname || admin.lastname;
            await admin.save();
            response.success(res, "", admin);
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // user banning handler
    banUser: async (req, res, next) => {
        try {
            const { id } = req.body;
            let user;

            if (!user) {
                user = await Mentor.findById(id);
            }

            if (!user) {
                user = await Student.findById(id);
            }

            if (!user) {
                return response.notfound(res);
            }

            if (user.isBanned) {
                user.isBanned = false;
            } else {
                user.isBanned = true;
            }

            await user.save();

            if (user.isBanned) response.success(res, "User has been banned");
            else response.success(res, "User has been unbanned");
            next();
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },

    // get all interactions for admin
    getAllInteractions: async (req, res, next) => {
        try {
            const mentors = await Mentor.find();
            const result = [];

            for await (const mentor of mentors) {
                const posts = await Post.find({ group_id: mentor._id }).populate("author");
                const meetings = await Meeting.find({ host: mentor._id })
                    .populate("host")
                    .populate("participants.user");

                result.push({
                    mentor,
                    posts,
                    meetings,
                });
            }

            response.success(res, "", { count: result.length, interactions: result });
        } catch (err) {
            console.log(err);
            response.error(res);
        }
    },
};
