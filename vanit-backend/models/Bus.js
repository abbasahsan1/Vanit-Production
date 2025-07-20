const db = require('../config/db');

const Bus = {
    getStats: () => {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM Buses WHERE status = 'active') AS active_buses,
                    (SELECT COUNT(*) FROM Buses) AS total_buses
                `,
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]);
                }
            );
        });
    }
};

module.exports = Bus;
