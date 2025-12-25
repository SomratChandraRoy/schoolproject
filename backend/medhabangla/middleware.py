"""
Custom middleware for database connection management
"""
from django.db import connection
from django.core.signals import request_finished
import logging

logger = logging.getLogger(__name__)


class DatabaseConnectionMiddleware:
    """
    Middleware to ensure database connections are properly managed
    and closed after each request to prevent connection pool exhaustion.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process the request
        response = self.get_response(request)
        
        # Close old connections after each request
        # This is especially important for long-running processes
        if connection.connection is not None:
            if connection.is_usable():
                # Connection is still good, let CONN_MAX_AGE handle it
                pass
            else:
                # Connection is broken, close it
                connection.close()
                logger.warning("Closed broken database connection")
        
        return response

    def process_exception(self, request, exception):
        """
        Close database connection on exception to prevent leaks
        """
        if connection.connection is not None:
            connection.close()
            logger.error(f"Closed database connection due to exception: {exception}")
        return None
