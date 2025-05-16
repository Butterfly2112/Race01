// NOTE: remember to npm init -y AND npm i mysql2

import mysql from 'mysql2';
import config from './config.json' with { type: 'json' };

const connection = mysql.createConnection(config);

connection.connect(err => {
    if (err) {
        console.error('Failed to connect to database: ', err);
        return;
    }

    console.log('Successfully connected to database!');
});

export default connection;