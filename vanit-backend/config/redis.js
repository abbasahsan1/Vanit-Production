const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Connected to Redis');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Redis connection failed:', error);
            this.isConnected = false;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    async set(key, value, expireSeconds = null) {
        if (!this.isConnected) return false;
        try {
            if (expireSeconds) {
                await this.client.setEx(key, expireSeconds, JSON.stringify(value));
            } else {
                await this.client.set(key, JSON.stringify(value));
            }
            return true;
        } catch (error) {
            console.error('Redis SET error:', error);
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    async del(key) {
        if (!this.isConnected) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis DEL error:', error);
            return false;
        }
    }

    async publish(channel, message) {
        if (!this.isConnected) return false;
        try {
            await this.client.publish(channel, JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Redis PUBLISH error:', error);
            return false;
        }
    }

    async subscribe(channel, callback) {
        if (!this.isConnected) return false;
        try {
            const subscriber = this.client.duplicate();
            await subscriber.connect();
            await subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                } catch (error) {
                    console.error('Error parsing Redis message:', error);
                }
            });
            return subscriber;
        } catch (error) {
            console.error('Redis SUBSCRIBE error:', error);
            return null;
        }
    }
}

module.exports = new RedisClient(); 