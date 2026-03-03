import sys
import asyncio
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("runner")

if sys.platform == 'win32':
    # This must be done before any asyncio loop is created
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        logger.info("Set WindowsProactorEventLoopPolicy for Playwright compatibility")
    except Exception as e:
        logger.error(f"Failed to set event loop policy: {e}")

import uvicorn

if __name__ == "__main__":
    logger.info("Starting uvicorn server (reload disabled, loop='asyncio')...")
    # Bind to 0.0.0.0 to allow access from other devices on the same network
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8002))
    
    uvicorn.run("server:app", host=host, port=port, reload=False, loop="asyncio")
