const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("./db")
const express = require("express")

const salt = "secret-key"
const SECRET = "this-is-for-JWT"

const app = express()

app.use(express.json())


app.post("/register", (req, res) =>{
    const {usernsme, email, password, role, createdAt} = req.body
})