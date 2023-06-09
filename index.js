import express from "express";
import path from "path";
import mongoose from "mongoose"; //used for connecting mongodb to nodejs 
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
}).then(() => console.log("Database Connected")).catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});
const user = mongoose.model("Users", userSchema);
const app = express();

//Using middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Setting up View Engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.verify(token, "dhusosjsisnsus");
        //console.log(decoded);
        req.user = await user.findById(decoded);
        // console.log(req.user);
        next();
    }
    else {
        res.redirect("/login");
    }
}
app.get("/", isAuthenticated, (req, res) => {
    // console.log(req.cookies); 
    res.render("logout", { name: req.user.name });
})

app.get("/login",(req,res) => {
    res.render("login");
})
app.post("/login", async (req, res) => {
    const { email,password} = req.body;
    let userinfo = await user.findOne({ email });
    if (!userinfo) {
        return res.redirect("/register");
    }
    const isMatch = await bcrypt.compare(password,userinfo.password); 
    if(!isMatch)
    {
        return res.render("login",{email,message: "Incorrect Password"});
    }
    const token = jwt.sign({ _id: userinfo._id }, "dhusosjsisnsus");
    res.cookie("token", token);
    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", async (req, res) => {
    const {name,email,password} = req.body;
    let userInfo = await user.findOne({email});
    if(userInfo)
    {
        return res.redirect("/login");
    }
    const hassPass = await bcrypt.hash(password,10);
    const userId = await user.create({name,email,password: hassPass});
    res.redirect("/");

})
app.post("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    })
    res.redirect("/");
});

app.listen(5000, () => {
    console.log("Server is working");
});
