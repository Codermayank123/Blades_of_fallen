import mongoose from 'mongoose';

export async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blades';

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}
