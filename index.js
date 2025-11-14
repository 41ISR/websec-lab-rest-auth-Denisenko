const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("./db")
const express = require("express")

const salt = "secret-key"
const SECRET = "this-is-for-JWT"

const app = express()

app.use(express.json())


const auth = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) res.status(401).json({error: "Нет токена авторизации"})

    if (!(authHeader.split(" ")[1])) res.status(401).json({error: "Неверный формат токена"})

    try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, SECRET)
        req.user = decoded
        next()
    } catch (error) {
        console.error(error)
    }
}

app.post("/api/auth/register", (req, res) =>{
    try {
        const {username, email, password} = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Не хватает данных" })
        }
        const syncSalt = bcrypt.genSaltSync(10)
        const hashed = bcrypt.hashSync(password, syncSalt)
        const query = db.prepare(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`)
        const info = query.run(username, email, hashed)
        const newUser = db.prepare(`SELECT * FROM users WHERE ID = ?`).get(info.lastInsertRowid)
        res.status(201).json(newUser)
    } catch (error) {
        console.error(error)
        res.status(401).json({error: "Неправильный токен"})
    }
})

app.post("/api/auth/login", (req,res) => {
    try {
        const { email, password } = req.body

        const user = db
            .prepare(`SELECT * FROM users WHERE email = ?`)
            .get(email)

        if (!user) res.status(401).json({ error: "Неправильные данные" })

        const valid = bcrypt.compareSync(password, user.password)

        if (!valid) res.status(401).json({ error: "Неправильные данные" })

        const token = jwt.sign({ ...user }, SECRET, { expiresIn: "24h" })

        const { password: p, ...response } = user

        res.status(200).json({ token: token, ...response })
    } catch (error) {
        console.error(error)
    }
})

app.get("/api/auth/profile", auth, (req,res) => {
    res.status(200).json(req.user)
})

// --------------

app.post("/api/books", auth, (req,res) => {
    const {title, author, year, genre, description} = req.body

    const query = db.prepare(`INSERT INTO books (title, author, year, genre, description, user_id) VALUES (?, ?, ?, ?, ?, ?)`)
    const info = query.run(title, author, year, genre, description, req.user.id)
    const newBook = db.prepare(`SELECT * FROM books WHERE ID = ?`).get(info.lastInsertRowid)
    res.status(201).json(newBook)
})

app.get("/api/books/:id", (req,res) => {
    
})

app.get("/api/books", (_,res) => {
    const data = db.prepare(`SELECT * FROM books`).all()

    res.status(200).json(data)
})

app.put("/api/books/:id", (req,res) => {
    
})

app.delete("/api/books/:id", (req,res) => {
    
})

// ------------

app.post("/api/books/:id/reviews", (req,res) => {
    
})

app.get("/api/books/:id/reviews", (req,res) => {
    
})

app.delete("/api/:id/reviews", (req,res) => {
    
})

// --------------

app.get("/api/admin/users", (req,res) => {
    
})

app.delete("/api/admin/users/:id", (req,res) => {
    
})

app.listen("3000", () => {
    console.log("Сервер запущен на порту 3000")
})