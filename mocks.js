const users = [
    {id: 1, role: 'admin', fullName: 'Israel israeli', email: 'israel.israeli@ptmobile.co.il', password: 'Aa123456'}
];
const transfers = [];

const fNames = ['Ronen', 'Dana', 'Avishai', 'Sergei', 'Asaf', 'Roslan', 'Tal', 'Itai', 'Tomer'];
const lNames = ['Cohen', 'Levi', 'Aharoni', 'Livne', 'Kaplan', 'Saudi'];

// users
for (let i = 50; i < 1000; i++) {
    const id = i + 1;
    const fName = fNames[Math.floor(Math.random() * fNames.length)];
    const lName = lNames[Math.floor(Math.random() * lNames.length)];

    const user = {
        id: id,
        fullName: `${fName} ${lName}`,
        email: `myemail${id}@gmail.com`,
        password: `Aa123456${Math.floor(Math.random() * 100000)}`,
        role: 'customer',
        balance: Math.floor(Math.random() * 100000)
    };

    users.push(user);
}

// transfers
for (let i = 2; i < users.length; i++) {
    const user = users[i];

    for (let j = 0; j < 5; j++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];

        const transfer = {
            fromUser: user.id,
            toUser: randomUser.id,
            amount: Math.floor(Math.random() * 1000),
            createdAt: (new Date()).toISOString()
        };

        transfers.push(transfer);
    }
}


module.exports.users = users;
module.exports.transfers = transfers;