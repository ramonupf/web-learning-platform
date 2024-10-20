//environment variables:
require('dotenv').config();

const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); //for generating token for password recovery

const multer = require('multer'); //to upload files
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

//paths for profile pictures from environment:
const PROFILE_PICTURES_PATH = process.env.PROFILE_PICTURES_PATH;
const PROFILE_PICTURES_URL_PATH = process.env.PROFILE_PICTURES_URL_PATH;

//Database operations:
const mongoose = require('mongoose');
//models:
const Member = require('./models/Member'); //group members
const Fee = require('./models/Fee'); //fees
const Faq = require('./models/Faq'); //faqs
const User = require('./models/User'); //user
const Course = require('./models/Course'); //courses
const Category = require('./models/Category'); //categories for specialization and courses

const port = 8080;

//upload files
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI);

app.use(express.urlencoded({ extended: true }));

//ejs as template engine
app.set('view engine', 'ejs');

//middleware to retrieve files from the public directory:
app.use(express.static('public'));

//session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


// middleware to store the last page visited, excluding login, logout, and register routes
app.use((req, res, next) => {
    const excludedPaths = ['/login', '/logout', '/register', '/forgot-password', '/favicon.ico'];
    
    //check if the current path starts with any of the excluded paths
    const isExcludedPath = excludedPaths.some(path => req.path.startsWith(path)) || req.path.startsWith('/reset-password');
    
    if (!isExcludedPath && req.method === 'GET') {
        req.session.lastPage = req.originalUrl;
        //console.log('Stored last page:', req.session.lastPage);
    }
    next();
});
//middlewares to ensure logged in user and to redirect authenticated users
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        req.session.lastPage = req.originalUrl; //Store the last page so that we can redirect to it after logging in
        res.redirect('/login');
    }
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session.user) {
        return res.redirect('/my-account');
    } else {
        return next();
    }
}

//function to ensure a user is ADMIN
function ensureAdmin(req, res, next) {
    if (req.session.user && req.session.user.accountType === 'Admin') {
        return next();
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
}

// ROUTE DEFINITION

//ADMIN ROUTES
app.get('/admin/manage-courses', ensureAdmin, async (req, res) => {
    try {
        const user = req.session.user || null;
        const courses = await Course.find().populate('instructors');  // Get all courses with instructor info
        res.render('manage-courses', { user, courses });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//HOME PAGE
app.get('/', async (req, res)=> {
    try {
        const user = req.session.user || null;
        // find new instructors
        const newInstructors = await User.find({ accountType: 'Instructor' })
            .sort({ createdAt: -1 })
            .limit(4); //maximum 4 of them

        // Find featured instructors
        const featuredInstructors = await User.find({ accountType: 'Instructor', featured: true })
            .limit(2);

        // find new courses
        const newCourses = await Course.find({})
            .populate('instructors') //populate instructors for details
            .sort({ createdAt: -1 })
            .limit(4); //maximum 4 of them

        // find featured courses
        const featuredCourses = await Course.find({ featured: true })
            .populate('instructors')  // poulate instructor 
            .limit(4);

        // Render the index page and pass the retrieved data
        res.render('index', {
            user,
            newInstructors,
            newCourses,
            featuredInstructors,
            featuredCourses
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//ABOUT US:
app.get('/about', async (req, res) => {
    try {
        const members = await Member.find();
        const user = req.session.user || null;
        res.render('about', { members, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//pricing: fees
app.get('/pricing', async (req, res)=>{
    try{
        const fees = await Fee.find();
        const user = req.session.user || null;
        res.render('pricing', {fees, user});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

//my account
app.get('/my-account', ensureAuthenticated, async(req, res)=>{
    try {
        let user = await User.findById(req.session.user._id);
        let coursesInstructing = []; 
        if (user.accountType === 'Instructor') {;
            coursesInstructing = await Course.find({ instructors: user._id });
        }

        if (user.coursesEnrolled.length > 0) {
            user = await user.populate('coursesEnrolled.course');
        }
        if (user.trialCourses.length > 0) {
            user = await user.populate('trialCourses.course');
        }
        res.render('my-account', { user, coursesInstructing, mongodbAtlasUrl: process.env.MONGODB_ATLAS_URL });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

//login with redirection if they are authenticated
app.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('login', { user: null, message: null });
});

app.get('/register', redirectIfAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('register', { user: null, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//register
app.get('/register',redirectIfAuthenticated, async(req, res)=>{
    try {
        const categories = await Category.find();
        const user = req.session.user || null;
        res.render('register', { user, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
})

// REGISTRATION
app.post('/register', upload.single('profilePicture'), async(req, res) =>{
    const {email, phone, password, passwordRetype, firstName,
        lastName, address, city, zipcode, country, accountType, schoolName,
        jobTitle, specialization } = req.body;
    const user = req.session.user || null;  // define a user always!!

    //check passwords
    if (password !== passwordRetype) {
        return res.render('register', { user, error: 'Passwords do not match' });
    }

    try{
        // check if user exists
        const existingUser = await User.findOne({ $or: [{ email: email }, { phone: phone }] });
        if (existingUser) {
            return res.render('register', { user, error: 'Email or phone number is already registered' });
        }

        //create user
        const newUser = new User({
            email,
            phone,
            password, // Password will be hashed automatically via pre-save hook in the model
            firstName,
            lastName,
            address,
            city,
            zipcode,
            country,
            accountType,
            //profilePicture: '/uploads/' + req.file.filename,
            //if instructor, assign different variables to fields, if not, leave them undefined
            schoolName: accountType === 'Instructor' ? schoolName : undefined,
            jobTitle: accountType === 'Instructor' ? jobTitle : undefined,
            specialization: accountType === 'Instructor' ? specialization : undefined
        });

        //save user to database to obtain ID and save profile picture
        await newUser.save();

        // Generate new filename with user _id and file extension
        const fileExtension = path.extname(req.file.originalname); // Get the file extension
        const newFileName = `${newUser._id}${fileExtension}`;
        const newFilePath = path.join(PROFILE_PICTURES_PATH, newFileName);

        // Rename the file to the new name
        fs.rename(req.file.path, newFilePath, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                return res.render('register', { user, error: 'Error uploading profile picture.' });
            }

            // Update the user's profilePicture path with the new file name
            newUser.profilePicture = `${PROFILE_PICTURES_URL_PATH}/${newFileName}`;
            newUser.save();  // Save the user again with the updated profile picture path

            // Redirect to the my-account page
            res.redirect('/my-account');
        });

    } catch(err){
        console.error(err); 
        return res.render('register', { user, error: 'Something went wrong during registration. Please try again.' });
    }
})

//FORGOT PASSWORD
app.get('/forgot-password', redirectIfAuthenticated, (req, res) => {
    const user = req.session.user || null;
    try {
        res.render('forgot-password', { user, error: null, resetMessage: null });;
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email }); //check if user exists
        if (!user) {
            return res.render('forgot-password', { error: 'No account associated with this email.', resetMessage: null });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');// Generate a unique token (simulating email token generation)

        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`; //reset link (without sending it through email!)

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity
        await user.save();

        const resetMessage = `An email has been sent to ${email} with the following link to reset your password: ${resetLink}`;
        res.render('forgot-password', { user: null, error: null, resetMessage, resetLink });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//reset it:
app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // find user with token and check it's not expired
        const user = await User.findOne({ 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) { //we pass an empty string
            return res.render('reset-password', { user: null, resetToken: '', error: 'Invalid or expired password reset token.' , redirect: false});
        }

        res.render('reset-password', { user: null, resetToken: token, error: null, redirect: false });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// resetting the password
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, passwordRetype } = req.body;

    // Find the user by reset token and ensure it's not expired
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.render('reset-password', { resetToken: '', user: null, error: null, message: 'Invalid or expired token.', redirect: false});
    }

    // Check if passwords match
    if (password !== passwordRetype) {
        return res.render('reset-password', { resetToken: token,user: null, error: null, message: 'Passwords do not match.', redirect: false });
    }

    user.password = password;//assign the new password (hashing is done in the schema, like when registering)
    user.resetPasswordToken = undefined; //erase token and expiration
    user.resetPasswordExpires = undefined;
    await user.save();

    res.render('reset-password', { user: null, resetToken: token, error: null, message: 'Password has been reset successfully. Redirecting to login...',redirect: true });
});


// LOGIN route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try{
        // find the user by email or phone
        const user = await User.findOne({ $or: [{ email: email }, { phone: email }] });
        if (!user) {
            return res.render('login', { user: null, error: 'Invalid email/phone or password' });
        }

        //compare the entered password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { user: null, error: 'Invalid email/phone or password' });
        }

        //use the stored last page if it exists. If not, my-account
        const redirectionPage = req.session.lastPage || '/my-account';

        req.session.user = user;// if credentials are correct, create a session
        
        delete req.session.lastPage;  // remove the stored last page after using it
        
        //DEBUG CODE
        //console.log('Redirecting to:', redirectionPage); 
        //console.log('Session lastPage:', req.session.lastPage);
        //console.log('Session user:', req.session.user);
        res.redirect(redirectionPage);

    }catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// LOGOUT route
app.get('/logout', (req, res) => {
    const redirectPage = req.get('referer') || '/';  //get previous url with referer
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/my-account');
        }
        res.redirect(redirectPage); // redirect to the previous URL
    });
});

// INSTRUCTOR PROFILES
app.get('/instructors/:id', async (req, res) => {
    try {
        // Find the instructor by their ID
        const instructor = await User.findById(req.params.id);

        if (!instructor || instructor.accountType !== 'Instructor') {
            return res.status(404).send('Instructor not found');
        }

        //find courses of the instructor using courses:
        const courses = await Course.find({ instructors: instructor._id });

        const newCourses = courses.slice(0, 5); // take the 5 most recent ones

        // Render the instructor profile page with these courses
        res.render('instructor-profile', { instructor, newCourses, courses, user: req.session.user || null });
    
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//BROWSE COURSES
// BY NAME
app.get('/browse-courses-name', async (req, res) => {
    try {
        const user = req.session.user || null;
        const courses = await Course.find().sort({ name: 1 });
        res.render('browse-courses-name', { user, courses });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// BY CATEGORY
app.get('/browse-courses-category', async (req, res) => {
    try {
        const categories = await Category.find(); //retrieve categories
        const coursesByCategory = {}; //store courses by category

        for (const category of categories) { // for each category, find the courses that belong to it
            const courses = await Course.find({ categories: category._id })
                .populate('instructors'); // instructors for each course
            coursesByCategory[category.name] = courses; // store courses under category name
        }

        const user = req.session.user || null;
        res.render('browse-courses-category', { coursesByCategory, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//COURSE DETAILS
app.get('/courses/:id', async (req, res) => {
    try {
        const user = req.session.user || null;
        const course = await Course.findById(req.params.id).populate('instructors').populate('categories');
        const categories = await Category.find(); // categories for editing course
        res.render('course-detail', { course, user, categories});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//TRIAL COURSES
app.get('/courses/:id/confirm-trial', ensureAuthenticated, async (req, res) =>{
    try {
        const user = req.session.user || null;
        const course = await Course.findById(req.params.id);
        res.render('confirm-trial', { course, user});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/courses/:id/trial', ensureAuthenticated, async (req, res) =>{
    try{
        const user = await User.findById(req.session.user._id);
        const course = await Course.findById(req.params.id);
        user.trialCourses = user.trialCourses || [];

        //check if the user already trialed the course
        const alreadyTrialed = user.trialCourses.some(trial => trial.course.equals(course._id));

        if (alreadyTrialed) {
            return res.render('order-failure', {user, message: 'You have already tried this course.' });
        }

        user.trialCourses.push({
            course: course._id,
            trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            trialActive: true
        });

        await user.save();
        req.session.save(() => {
            res.redirect(`/thank-you?courseId=${course._id}`);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//ORDER COURSES
//order placement
app.get('/courses/:id/order', ensureAuthenticated, async (req, res) => {
    const course = await Course.findById(req.params.id).populate('instructors');
    const user = req.session.user;
    res.render('order-placement', { course, user });
});

//complete order and redirect to thank you page:
app.post('/courses/:id/order-complete', ensureAuthenticated, async (req, res) => {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.session.user._id);

    user.coursesEnrolled = user.coursesEnrolled || [];
    user.trialCourses = user.trialCourses || [];

    const { accessDuration } = req.body;

    //check if the user is already enrolled in the course
    const alreadyEnrolled = user.coursesEnrolled.some(enrollment => 
        enrollment.course.equals(course._id) && !enrollment.enrollmentEndDate
    );

    if (alreadyEnrolled) {
        return res.render('order-failure', { user, message: 'You are already permanently enrolled in this course.' });
    }

    //enrollment based on duration
    if (accessDuration === '7-days') {
        // Check if the user already has an active 7-day enrollment
        const alreadySevenDay = user.coursesEnrolled.some(enrollment =>
            enrollment.course.equals(course._id) && enrollment.enrollmentEndDate
        );

        if (alreadySevenDay) {
            return res.render('order-failure', { user, message: 'You already have an active 7-day enrollment for this course.' });
        }

        user.coursesEnrolled.push({
            course: course._id,
            enrollmentStartDate: new Date(),
            enrollmentEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days from now
        });

    } else if (accessDuration === 'permanent') {
        user.coursesEnrolled.push({
            course: course._id,
            enrollmentStartDate: new Date(),
            enrollmentEndDate: null 
        });
    }

    //save to mongodb:
    await user.save();

    req.session.save(() => {
        res.redirect(`/thank-you?courseId=${course._id}`);
    });
});

// Thank You Page
app.get('/thank-you',ensureAuthenticated, async (req, res) => {
    const courseId = req.query.courseId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).send('Invalid course ID');
    }

    // Fetch the course based on the ID from the query parameter
    const course = await Course.findById(courseId);

    if (!course) {
        return res.status(404).send('Course not found');
    }

    try{
        const user = req.session.user || null;
        res.render('thank-you', {user, course});
    } catch(err){
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ADD COURSES
app.get('/add-course', ensureAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find(); //existing categories
        const user = req.session.user;

        //only instructors can access this route
        if (user.accountType !== 'Instructor') {
            return res.status(403).send('Only instructors can add courses.');
        }

        res.render('add-course', { user, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Handle adding a new course (POST)
// Handle adding a new course (POST)
app.post('/add-course', ensureAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, newCategory } = req.body;
        const user = req.session.user;

        // ONLY INSTRUCTORS
        if (user.accountType !== 'Instructor') {
            return res.status(403).send('Only instructors can add courses.');
        }

        // Handle uploaded image
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).send('Please upload an image.');
        }

        // Handle category selection/creation
        let categoryIds = [];
        
        // Get selected categories (ensure that `categories[]` is passed correctly)
        const { categories } = req.body;

        if (Array.isArray(categories)) {
            categoryIds = categories;
        } else if (categories) {
            categoryIds.push(categories);  // If only one category is selected, treat it as an array
        }

        // Check if a new category is being added
        if (newCategory && newCategory.trim() !== '') {
            const categorySlug = slugify(newCategory, { lower: true, strict: true });
            // Check if the category already exists
            let createdCategory = await Category.findOne({ name: newCategory });

            // If the category does not exist, create it
            if (!createdCategory) {
                createdCategory = new Category({ name: newCategory, slug: categorySlug });
                await createdCategory.save();
            }
            categoryIds.push(createdCategory._id);
        }

        // Create a new course without image initially to get the course ID
        const newCourse = new Course({
            name,
            price,
            description,
            instructors: [user._id],
            categories: categoryIds  // Add the selected or new category IDs
        });

        // Save the course to generate the course ID
        await newCourse.save();

        // Now that we have the course ID, rename the image based on courseId
        const fileExtension = path.extname(imageFile.originalname);  // Get file extension (e.g., .jpg, .png)
        const newImageName = `${newCourse._id}${fileExtension}`;  // Image name based on course ID
        const newImagePath = `/uploads/course-pictures/${newImageName}`; // New image path

        // Move the uploaded file to the correct path
        fs.rename(imageFile.path, `public${newImagePath}`, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                return res.status(500).send('Error uploading image.');
            }
        });

        // Update the course image path in the database
        newCourse.image = newImagePath;
        await newCourse.save();  // Save the updated course

        // Redirect to the course detail page after creation
        res.redirect(`/courses/${newCourse._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while adding course');
    }
});


//MANAGING or EDITING COURSES
//edit NAME
app.post('/courses/:id/edit-name', ensureAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { name } = req.body;

        const course = await Course.findById(courseId);

        // only the first instructor can edit the course name
        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }

        course.name = name;
        await course.save();
        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//edit PRICE
app.post('/courses/:id/edit-price', ensureAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { price } = req.body;

        const course = await Course.findById(courseId);

        // only the first instructor can edit the course PRICE
        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }
        course.price = price;
        await course.save();

        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//edit DESCRIPTION
app.post('/courses/:id/edit-description', ensureAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { description } = req.body;

        const course = await Course.findById(courseId);

        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }

        course.description = description;
        await course.save();

        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//edit IMAGE
app.post('/courses/:id/edit-image', ensureAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const courseId = req.params.id;
        const imageFile = req.file;

        const course = await Course.findById(courseId);

        // Ensure that only the instructor can edit the course image
        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }

        // Handle uploaded image
        if (!imageFile) {
            return res.status(400).send('Please upload an image.');
        }

        // Image name will be based on the course ID
        const fileExtension = path.extname(imageFile.originalname);  // Get file extension (e.g., .jpg, .png)
        const newImageName = `${courseId}${fileExtension}`;  // Image name based on course ID
        const newImagePath = `/uploads/course-pictures/${newImageName}`; // New image path

        // Delete the previous image if it exists
        if (course.image && fs.existsSync(`public${course.image}`)) {
            fs.unlink(`public${course.image}`, (err) => {
                if (err) {
                    console.error('Error deleting previous image:', err);
                }
            });
        }

        // Rename and move the new uploaded file
        fs.rename(imageFile.path, `public${newImagePath}`, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                return res.status(500).send('Error uploading image.');
            }
        });

        // Update the course image path in the database
        course.image = newImagePath;
        await course.save();  // Save the updated course

        // Redirect to the course detail page
        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//edit CATEGORIES
app.post('/courses/:id/edit-categories', ensureAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { categories, newCategory } = req.body;

        const course = await Course.findById(courseId);

        // Ensure that only the instructor can edit the course categories
        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }

        // Handle existing category selection
        let categoryIds = Array.isArray(categories) ? categories : [categories];

        // Handle new category creation
        if (newCategory && newCategory.trim() !== '') {
            const categorySlug = slugify(newCategory, { lower: true, strict: true });

            // Check if the new category already exists
            let createdCategory = await Category.findOne({ name: newCategory });

            // If the category does not exist, create it
            if (!createdCategory) {
                createdCategory = new Category({ name: newCategory, slug: categorySlug });
                await createdCategory.save();
            }
            categoryIds.push(createdCategory._id);
        }

        // Update the course categories
        course.categories = categoryIds;
        await course.save();

        // Redirect back to the course detail page
        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

//edit FEatured
// Route to toggle featured status
app.post('/courses/:id/edit-featured', ensureAuthenticated, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { featured } = req.body; // Get the value from the form (true/false)

        const course = await Course.findById(courseId);

        // Ensure that only the instructor can toggle the featured status
        if (req.session.user._id.toString() !== course.instructors[0].toString()
            && (req.session.user.accountType !== 'Admin')) {
            return res.status(403).send('You are not authorized to perform this action.');
        }

        // Update the featured status
        course.featured = featured === 'true'; // Convert string to boolean
        await course.save();

        // Redirect back to the course detail page
        res.redirect(`/courses/${courseId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



//faqs
app.get('/faqs', async(req, res)=>{
    try{
        const faqs = await Faq.find();
        const user = req.session.user || null;
        res.render('faqs', {faqs, user});
    } catch(err){
        console.error(err);
        res.status(500).send('Server Error');
    }
})

//contact
app.get('/contact', (req,res)=> {
    const user = req.session.user || null;
    res.render('contact', { user });
})



//COPYRIGHT, TOS, AND PRIVACY:
app.get('/copyright', (req, res) => {
    const user = req.session.user || null;
    res.render('copyright', { user });
});

app.get('/terms-of-service', (req, res) => {
    const user = req.session.user || null;
    res.render('terms-of-service', { user }); 
});

app.get('/privacy-policy', (req, res) => {
    const user = req.session.user || null;
    res.render('privacy-policy', { user }); 
});

// Catch-all route for handling 404 errors
app.use((req, res, next) => {
    res.status(404).render('404', { user: req.session.user || null });
});

// start the server:
app.listen(port, ()=> {
    console.log(`Running server on http://localhost:${port}`);
});

