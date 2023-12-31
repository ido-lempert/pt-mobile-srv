require('dotenv').config();

const express = require('express');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const {Pool} = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOSTNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    // ssl: true,
});

const secret = 'T0p$ecreTT';


const verifyToken = async (req, res, next) => {
    const authorization = req.headers['authorization'];
    if (typeof authorization !== 'undefined') {
        try {
            const parsed = JSON.parse(atob(authorization.split('.')[1]));

            const result = await pool.query('SELECT * FROM users WHERE id = $1', [parsed.id]);
            const user = result.rows[0];
            if (!user) return res.sendStatus(403);

            req.user = user;
            next();
        } catch (e) {
            return res.sendStatus(403);
        }
    } else {
        return res.sendStatus(403);
    }
}

app.use(json());

app.use((req,res,next) => {
    console.log('***', req.path, req.query, req.body);

    next();
});

app.get('/users', verifyToken, (req, res) => {
    try{
        if (req.user.role === 'admin') {
            console.log(req.path, users);
            return res.json(users);
        } else {
            console.log(req.path, 403);
            return res.sendStatus(403);
        }
    } catch (e) {
        res.sendStatus(500);
    }
});

app.get('/profile', verifyToken, async (req, res) => {
    try{
        const result = await pool.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
        const data = result.rows[0];
        console.log(req.path, data);
        return res.json(data);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.get('/transfers', verifyToken, async (req, res) => {
    try{
        let result;
        if (req.user.role === 'admin') {
            result = await pool.query('SELECT * FROM transfers');
        } else {
            result = await pool.query('SELECT * FROM transfers WHERE to_user = $1 OR from_user = $2', [req.query.userId, req.query.userId]);
        }
        const data = result.rows ? result.rows : [];
        console.log(req.path, data);
        return res.json(data);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/transfers', verifyToken, async (req, res) => {
    if (! (req.body.to_user && req.body.amount)) return res.sendStatus(500);


    try{
        const transfer = [req.user.id, req.body.to_user, req.body.amount];

        const result = await pool.query('INSERT INTO transfers (from_user, to_user, amount) VALUES ($1,$2,$3) RETURNING *', transfer);
        const result1 = await pool.query('UPDATE users SET balance = balance - $2 WHERE id = $1', [req.user.id, req.body.amount]);

        console.log(req.path, result.rows[0], result1.rows[0]);

        return res.json(result.rows[0]);
    } catch (e) {
        res.sendStatus(500);
    }

});

app.post('/register', async (req, res) => {
    if (! (req.body.email && req.body.password && req.body.fullName)) return res.sendStatus(500);

    try{
        const user = [req.body.fullName, req.body.email, req.body.password, 'customer', Math.floor(Math.random() * 1000)];
        const result = await pool.query('INSERT INTO users (fullName, email, password, role, balance) VALUES ($1,$2,$3,$4,$5) RETURNING *', user);

        const data = {msg: 'register success'};

        console.log(req.path, data, result.rows[0]);

        return res.json(data);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/login', async (req, res) => {
    if (! (req.body.email && req.body.password)) return res.sendStatus(500);

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [req.body.email, req.body.password]);
        if (!result.rows.length) return res.sendStatus(500);

        const {id, fullname, role} = result.rows[0];

        jwt.sign({id, fullname, role}, secret, { algorithm: 'HS256'}, (err, token)=>{
            const data = {id, token};
            console.log(req.path, data);
            res.json(data);
        });
    } catch (e) {
        console.log(req.path, 500);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})