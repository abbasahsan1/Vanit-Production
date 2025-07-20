const crypto = require('crypto');
const QRCode = require('qrcode');
const pool = require('../config/db');

class QRCodeService {
    constructor() {
        this.secretKey = process.env.QR_SECRET_KEY || 'vanit-qr-secret-key-2025';
    }

    /**
     * Generate a secure QR code for a route
     * @param {string} routeName - Name of the route
     * @returns {object} - QR code data and image
     */
    async generateRouteQRCode(routeName) {
        try {
            const timestamp = Date.now();
            const expiryTime = timestamp + (24 * 60 * 60 * 1000); // 24 hours validity
            
            // Create QR payload
            const qrPayload = {
                route_name: routeName,
                generated_at: timestamp,
                expires_at: expiryTime,
                version: "1.0"
            };

            // Create security hash
            const dataToHash = `${routeName}:${timestamp}:${expiryTime}:${this.secretKey}`;
            const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
            qrPayload.hash = hash;

            // Encode as base64 for QR code scanning
            const qrData = Buffer.from(JSON.stringify(qrPayload)).toString('base64');

            // Generate actual QR code image with high quality PNG output
            const qrCodeImage = await QRCode.toDataURL(qrData, {
                type: 'image/png',
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000FF',
                    light: '#FFFFFFFF'
                },
                errorCorrectionLevel: 'H',
                rendererOpts: {
                    quality: 1.0
                }
            });

            // Generate high-quality buffer for download with proper PNG headers
            const qrCodeBuffer = await QRCode.toBuffer(qrData, {
                type: 'png',
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
            });

            // Store QR code in database
            await pool.query(
                'UPDATE routes SET qr_code = ?, qr_generated_at = NOW() WHERE route_name = ?',
                [qrData, routeName]
            );

            console.log(`✅ Generated QR code for route: ${routeName}`);
            return {
                qrData: qrData,
                qrImage: qrCodeImage,
                qrBuffer: qrCodeBuffer,
                routeName: routeName,
                generatedAt: timestamp,
                expiresAt: expiryTime
            };
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Validate a scanned QR code
     * @param {string} qrData - Base64 encoded QR data
     * @returns {object} - Validation result with route info
     */
    async validateQRCode(qrData) {
        try {
            // Decode QR data
            const decodedData = Buffer.from(qrData, 'base64').toString('utf8');
            const qrPayload = JSON.parse(decodedData);

            // Check required fields
            if (!qrPayload.route_name || !qrPayload.generated_at || !qrPayload.hash) {
                return {
                    isValid: false,
                    error: 'Invalid QR code format'
                };
            }

            // Check expiry
            if (Date.now() > qrPayload.expires_at) {
                return {
                    isValid: false,
                    error: 'QR code has expired'
                };
            }

            // Validate hash
            const dataToHash = `${qrPayload.route_name}:${qrPayload.generated_at}:${qrPayload.expires_at}:${this.secretKey}`;
            const expectedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
            
            if (qrPayload.hash !== expectedHash) {
                return {
                    isValid: false,
                    error: 'QR code security validation failed'
                };
            }

            // Check if route exists
            const [routeData] = await pool.query(
                'SELECT id, route_name FROM routes WHERE route_name = ?',
                [qrPayload.route_name]
            );

            if (routeData.length === 0) {
                return {
                    isValid: false,
                    error: 'Route not found'
                };
            }

            return {
                isValid: true,
                routeName: qrPayload.route_name,
                routeId: routeData[0].id,
                generatedAt: qrPayload.generated_at,
                qrPayload: qrPayload
            };
        } catch (error) {
            console.error('Error validating QR code:', error);
            return {
                isValid: false,
                error: 'Invalid QR code data'
            };
        }
    }

    /**
     * Get stored QR code for a route
     * @param {string} routeName - Name of the route
     * @returns {object|null} - QR code data and image or null
     */
    async getRouteQRCode(routeName) {
        try {
            const [result] = await pool.query(
                'SELECT qr_code, qr_generated_at FROM routes WHERE route_name = ?',
                [routeName]
            );

            if (result.length === 0 || !result[0].qr_code) {
                return null;
            }

            // Check if QR code is still valid (24 hours)
            const generatedAt = new Date(result[0].qr_generated_at);
            const now = new Date();
            const hoursDifference = (now - generatedAt) / (1000 * 60 * 60);

            if (hoursDifference > 24) {
                // QR code expired, generate new one
                return await this.generateRouteQRCode(routeName);
            }

            // Generate QR image from stored data
            const qrCodeImage = await QRCode.toDataURL(result[0].qr_code, {
                type: 'image/png',
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000FF',
                    light: '#FFFFFFFF'
                },
                errorCorrectionLevel: 'H',
                rendererOpts: {
                    quality: 1.0
                }
            });

            return {
                qrData: result[0].qr_code,
                qrImage: qrCodeImage,
                routeName: routeName,
                generatedAt: result[0].qr_generated_at
            };
        } catch (error) {
            console.error('Error getting route QR code:', error);
            return null;
        }
    }

    /**
     * Generate QR codes for all routes
     * @returns {object} - QR codes for all routes
     */
    async generateAllRouteQRCodes() {
        try {
            const [routes] = await pool.query('SELECT route_name FROM routes');
            const qrCodes = {};

            for (const route of routes) {
                qrCodes[route.route_name] = await this.generateRouteQRCode(route.route_name);
            }

            console.log(`✅ Generated QR codes for ${routes.length} routes`);
            return qrCodes;
        } catch (error) {
            console.error('Error generating all QR codes:', error);
            throw new Error('Failed to generate QR codes');
        }
    }
}

module.exports = new QRCodeService();
