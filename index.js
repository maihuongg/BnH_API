
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyparser = require('body-parser');
const cloudinary = require('cloudinary');
const authRoute = require("./routes/auth");
const accountRoute = require("./routes/account");
const userRoute = require("./routes/user");
const fileupload = require("express-fileupload");
const adminRoute = require("./routes/admin")
const hospitalRoute = require("./routes/hospital");

dotenv.config();
const app = express()

// ket noi database
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("Connected to Database");
    })
    .catch((error) => {
        console.error("Error connecting to database:", error);
    });
//const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000'];
const allowedOrigins = ['http://localhost:19006', 'exp://192.168.1.5:8081', 'http://localhost:3000', 'http://localhost:4000'];


app.use(cors({
    origin: allowedOrigins,  // Replace with the actual origin of your client
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use(bodyparser.urlencoded({ extended: true}));
app.use(fileupload());

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_NAME,
    api_key : process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})
//ROUTES
app.use("/v1/auth", authRoute);
app.use("/v1/admin", adminRoute);
app.use("/v1/hospital", hospitalRoute);
app.use("/v1/user", userRoute);
app.listen(process.env.PORT, () => {
    console.log("Server is running");
});
//AUTHENTICATION
