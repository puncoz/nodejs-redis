const express = require("express"),
    expressHandlebars = require("express-handlebars"),
    path = require("path"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    redis = require("redis")

// Create redis client
let redisClient = redis.createClient()

redisClient.on("connect", function() {
    console.log("Connected to redis...")
})

redisClient.on("error", function(error) {
    console.log("Error: " + error)
})

// set port
const port = 3000

// init app
const app = express()

// setup view engine
app.engine("handlebars", expressHandlebars({defaultLayout: "main"}))
app.set("view engine", "handlebars")

// setup the body parser (just standard middle wares)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// setup the method override
app.use(methodOverride("_method"))

// routes
app.get("/", function(req, res, next) {
    res.render("searchUsers")
})

app.post("/users/search", function(req, res, next) {
    const id = req.body.search

    redisClient.hgetall(id, function(error, object) {
        if (!object) {
            res.render("searchUsers", {
                error: "User does not exists.",
                search: id,
            })
        } else {
            object.id = id
            res.render("userDetails", {
                user: object,
            })
        }
    })
})

app.get("/users/add", function(req, res, next) {
    res.render("addUser")
})

app.post("/users/add", function(req, res, next) {
    const {id, first_name, last_name, email, phone} = req.body

    redisClient.hmset(id, [
        "first_name", first_name,
        "last_name", last_name,
        "email", email,
        "phone", phone,
    ], function(error, reply) {
        if (error) {
            console.log("Add user error >>> ", error)
        }

        console.log("Add user reply >>> ", reply)
        res.redirect("/")
    })
})

app.delete("/users/:id", function(req, res, next) {
    redisClient.del(req.params.id)
    res.redirect("/")
})

app.listen(port, function() {
    console.log("Server started on port: " + port)
})
