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
        res.status(401).json({error:"token error"})
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
    const data = db.prepare(`SELECT books.id, books.title, books.author, users.username AS added_by FROM books JOIN users ON books.user_id = users.id`).all()

    res.status(200).json(data)
})

app.get("/api/books", (_,res) => {
    const data = db.prepare(`SELECT * FROM books`).all()

    res.status(200).json(data)
})

app.put("/api/books/:id", (req,res) => {
    try {
        const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
        if (!book) {
            return res.status(404).json({ error: "Книга не найдена" });
        }

        if (book.createdBy !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Доступ запрещен" });
        }

        let updateQuery = "UPDATE book SET";
        const params = [];
        if (title) {
            updateQuery += " title = ?,";
            params.push(title);
        }
        if (author) {
            updateQuery += " author = ?,";
            params.push(author);
        }
        if (year) {
            updateQuery += " year = ?,";
            params.push(year);
        }
        if (genre) {
            updateQuery += " genre = ?,";
            params.push(genre);
        }
        if (description !== undefined) {
            updateQuery += " description = ?,";
            params.push(description);
        }

        if (params.length === 0) {
            return res.status(400).json({ error: "Нет данных для обновления" });
        }

        updateQuery = updateQuery.slice(0, -1) + " WHERE id = ?";
        params.push(id);

        db.prepare(updateQuery).run(...params);
        const updatedBook = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
        res.status(200).json(updatedBook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
})

app.delete("/api/books/:id", (req,res) => {
    const { id } = req.params;

    try {
        const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
        if (!book) {
            return res.status(404).json({ error: "Книга не найдена" });
        }

        if (book.createdBy !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Доступ запрещен" });
        }

        db.prepare("DELETE FROM books WHERE id = ?").run(id);
        res.status(200).json({ message: "Книга удалена" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
})

// ------------

app.post("/api/books/:id/reviews", auth, (req,res) => {
    const {rating, comment} = req.body
    const {id} = req.params

    const query = db.prepare(`INSERT INTO rewiews (rating, comment, book_id, user_id) VALUES (?, ?, ?, ?)`)
    const info = query.run(rating, comment, id, req.user.id)
    const newRew = db.prepare(`SELECT * FROM rewiews WHERE ID = ?`).get(info.lastInsertRowid)
    res.status(201).json(newRew)
})

app.get("/api/books/:id/reviews", (req,res) => {
    const data = db.prepare(`SELECT * FROM reviews JOIN books ON reviews.book_id = books.id`).all()

    res.status(200).json(data)
})

app.delete("/api/:id/reviews", (req,res) => {
    const { id } = req.params;

    try {
        const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
        if (!review) {
            return res.status(404).json({ error: "Книга не найдена" });
        }

        if (reviews.user_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Доступ запрещен" });
        }

        db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
        res.status(200).json({ message: "Отзыв удален" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
})

// --------------

app.get("/api/admin/users", (req,res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
    }
    const data = db.prepare(`SELECT * FROM users`).all()

    res.status(200).json(data)
})

app.delete("/api/admin/users/:id", (req,res) => {
    const { id } = req.params;

    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
    }
    try {
        const review = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!review) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(id);
        res.status(200).json({ message: "Пользователь удален" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }

    res.status(200).json(data)
})

app.listen("3000", () => {
    console.log("Сервер запущен на порту 3000")
})