const db = require('../config/db');

const Captain = {
    getStats: () => {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM Captains WHERE status = 'active') AS active_captains,
                    (SELECT COUNT(*) FROM Captains) AS total_captains
                `,
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]);
                }
            );
        });
    }
};

module.exports = Captain;
