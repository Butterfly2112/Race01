// NOTE: remember to npm init -y AND npm i mysql2
// NOTE: when testing use await keyword: await hero.find(1);
// NOTE: include your own password in config file (or delete the field if your configuration doesn't need the password)

import connection from '../db.js';

class Model {
    constructor(attributes = {}) {
        this.attributes = attributes;
    }

    find(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM heroes WHERE id = ?', [id], (err, res) => {
                if (err) {
                    return reject(new Error('Failed to process a query: ' + err));
                }
                else {
                    if (!res[0]) {
                        return resolve(null);
                    }

                    this.attributes = res[0];
                    resolve(res[0]);
                }
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM heroes WHERE id = ?', [id], (err, res) => {
                if (err) return reject(new Error(`Failed to process a query: ${err}`));
                if (!res[0]) return reject(new Error(`Failed to process a query: ${err}`));

                connection.query('DELETE FROM heroes WHERE id = ?', [id], (err, res) => {
                    if (err) return reject(err);
                    resolve(res[0]);
                });
            });
        });
    }


    save(name = '', description = '', class_role = 'dps') {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM heroes WHERE name = ?', [name], (err, res) => {
                if (err) return reject(new Error(`Failed to process a query: ${err}`));

                if (!res[0]) {
                    connection.query('INSERT INTO heroes(name, description, class_role)' +
                        'VALUES (?, ?, ?)', [name, description, class_role],
                        (err, res) => {
                            if (err) {
                                return reject(new Error(`Failed to process a query: ${err}`));
                            }

                            resolve(res);
                        });
                }
                else {
                    connection.query('UPDATE heroes SET description = ?, class_role = ? WHERE name = ?',
                                    [description, class_role, name],
                                    (err, res) => {
                        if (err) {
                            return reject(new Error(`Failed to process a query: ${err}`));
                        }

                        resolve(res);
                    })
                }
            });
        });
    }
}

export default Model;