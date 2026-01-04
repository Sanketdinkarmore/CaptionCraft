from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global database client
client: Optional[AsyncIOMotorClient] = None
database = None

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    
    try:
        if not settings.MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        database = client[settings.DATABASE_NAME]
        
        # Test the connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
        
        return database
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database

