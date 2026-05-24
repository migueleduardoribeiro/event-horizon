import sys
import logging
from loguru import logger

def setup_logger():
    # Remove default handler
    logger.remove()
    
    # Add beautiful custom handler
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
        colorize=True
    )
    
    # Intercept standard logging messages and route them to loguru
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1

            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Capture uvicorn and fastapi logs
    loggers = ["uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"]
    for logger_name in loggers:
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False
        
    logger.info("Logger setup complete. Ready for action!")

# Export the configured logger
__all__ = ["logger", "setup_logger"]
