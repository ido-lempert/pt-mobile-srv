require('dotenv').config();

const express = require('express');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const {users, transfers} = require('./mocks');
const {Pool} = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOSTNAME,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD
});

const secret = 'T0p$ecreTT';

// function addUser(user){
//     const lastID = users[users.length-1].id;
//
//     const newUser = {
//         id: lastID + 1,
//         fullName: user.fullName,
//         email: user.email,
//         password: user.password,
//         role: 'customer',
//         balance: Math.floor(Math.random() * 100000)
//     };
//
//     users.push(newUser);
//
//     return {id: newUser.id, fullName: newUser.fullName, role: newUser.role};
// }

// function addTransfer(transfer){
//     console.log('addTransfer', transfer);
//     transfers.push(transfer);
//     return transfer;
// }

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
    console.log('***', req.path, req.body);

    next();
});

app.get('/users', verifyToken, (req, res) => {
    if (req.user.role === 'admin') {
        console.log(req.path, users);
        res.json(users);
    } else {
        console.log(req.path, 403);
        res.sendStatus(403);
    }
});

app.get('/transfers', verifyToken, async (req, res) => {
    let result;
    if (req.user.role === 'admin') {
        result = await pool.query('SELECT * FROM transfers');
    } else {
        result = await pool.query('SELECT * FROM transfers WHERE toUser = $1 OR fromUser = $1', [req.query.userId]);
    }

    res.json(result.rows ? result.rows : []);
});

app.post('/transfer', verifyToken, async (req, res) => {
    if (! (req.body.toUser && req.body.amount)) return res.sendStatus(500);

    const transfer = [req.user.id, req.body.toUser, req.body.amount];
    const result = await pool.query('INSERT INTO transfers (fromUser, toUser, amount) VALUES ($1,$2,$3) RETURNING *', transfer);

    console.log(req.path, result.rows[0]);
    res.json(result.rows[0]);
});

app.post('/register', async (req, res) => {
    if (! (req.body.email && req.body.password && req.body.fullName)) return res.sendStatus(500);

    const user = [req.body.fullName, req.body.email, req.body.password, 'customer', Math.floor(Math.random() * 1000)];
    const result = await pool.query('INSERT INTO users (fullName, email, password, role, balance) VALUES ($1,$2,$3,$4,$5) RETURNING *', user);

    const data = {msg: 'register success'};

    console.log(req.path, data, result.rows[0]);

    res.json(data);
});

app.post('/login', async (req, res) => {
    if (! (req.body.email && req.body.password)) return res.sendStatus(500);

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [req.body.email, req.body.password]);
        if (!result.rows.length) return res.sendStatus(500);

        const {id, fullName, role} = result.rows[0];

        jwt.sign({id, fullName, role}, secret, { algorithm: 'HS256'}, (err, token)=>{
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