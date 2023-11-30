const express = require('express');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');
const {users, transfers} = require('./mocks');

const app = express();
const port = process.env.PORT || 3000;

const secret = 'T0p$ecreTT';

function addUser(user){
    const lastID = users[users.length-1].id;

    const newUser = {
        id: lastID + 1,
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        role: 'customer',
        balance: Math.floor(Math.random() * 100000)
    };

    users.push(newUser);

    return {id: newUser.id, fullName: newUser.fullName, role: newUser.role};
}

function addTransfer(data){
    const transfer = {
        fromUser: 1,
        toUser: 2,
        amount: 123,
        createdAt: (new Date()).toISOString()
    };

    transfers.push(transfer);
}

function verifyToken(req, res, next){
    const authorization = req.headers['authorization'];
    if (typeof authorization !== 'undefined') {
        try {
            const parsed = JSON.parse(atob(authorization.split('.')[1]));
            const user = users.find(u => u.id === parsed.id);
            if (!user) res.sendStatus(403);
            req.user = user;
            next();
        } catch (e) {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(403);
    }
}

app.get('/users', verifyToken, (req, res) => {
    if (req.user.role === 'admin') {
        res.json(users);
    } else {
        res.sendStatus(403);
    }
});

app.get('/transfers', verifyToken, (req, res) => {
    if (req.user.role === 'admin') {
        res.json(transfers);
    } else {
        const filtered = transfers.filter(transfer => transfer.toUser == req.query.userId || transfer.fromUser == req.query.userId);
        res.json(filtered ? filtered : []);
    }

});

app.post('/transfer', verifyToken, (req, res) => {
    if (! (req.body.toUser && req.body.amount)) res.sendStatus(500);

    // req.user.balance += Number(req.body.amount);
    // req.user.balance -= Number(req.body.amount);

    const transfer = addTransfer({...req.body, fromUser: req.user.id});

    res.json(transfer);
});

app.post('/register', json(), (req, res) => {
    if (! (req.body.email && req.body.password && req.body.fullName)) res.sendStatus(500);

    const user = addUser(req.body);

    console.log('user', user);

    const data = {msg: 'register success', token};
    res.json(data);
});

app.post('/login', json(), (req, res) => {
    try {
        const {id, fullName, role} = users.find(u => u.email === req.body.email && u.password === req.body.password);
        jwt.sign({id, fullName, role}, secret, { algorithm: 'HS256'}, (err, token)=>{
            const data = {msg: 'login success', token};
            res.json(data);
        });
    } catch (e) {
        res.sendStatus(500);
    }

});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})