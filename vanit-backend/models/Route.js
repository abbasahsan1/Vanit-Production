const db = require('../config/db');

const Route = {
    getStats: () => {
        return new Promise((resolve, reject) => {
            db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM Routes WHERE status = 'active') AS active_routes,
                    (SELECT COUNT(*) FROM Routes) AS total_routes
                `,
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]);
                }
            );
        });
    }
};

module.exports = Route;
