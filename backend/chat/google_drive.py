"""
Google Drive Integration for Chat File Storage
"""
import os
import json
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from django.conf import settings
import io


logger = logging.getLogger(__name__)


class GoogleDriveService:
    """Service for uploading and managing files on Google Drive"""
    
    def __init__(self):
        """Initialize Google Drive service with credentials"""
        self.SCOPES = ['https://www.googleapis.com/auth/drive.file']
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize the Google Drive API service"""
        try:
            # Get credentials from settings
            credentials_json = settings.GOOGLE_DRIVE_CREDENTIALS_JSON
            
            if not credentials_json:
                raise ValueError("Google Drive credentials not configured")
            
            # Parse credentials
            if isinstance(credentials_json, str):
                normalized = credentials_json.strip()

                # Allow env values wrapped in a single pair of quotes.
                # This commonly happens when values are copied from .env snippets.
                if len(normalized) >= 2 and normalized[0] == normalized[-1] and normalized[0] in {'"', "'"}:
                    normalized = normalized[1:-1].strip()

                try:
                    credentials_info = json.loads(normalized)
                except json.JSONDecodeError:
                    # Fallback for values that were escaped once before reaching env.
                    # This keeps compatibility with CI secret paste variations.
                    unescaped = bytes(normalized, 'utf-8').decode('unicode_escape')
                    credentials_info = json.loads(unescaped)
            else:
                credentials_info = credentials_json
            
            # Create credentials
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=self.SCOPES
            )
            
            # Build the service
            self.service = build('drive', 'v3', credentials=credentials)
            
        except Exception as e:
            logger.exception(
                "Error initializing Google Drive service. "
                "Ensure GOOGLE_DRIVE_CREDENTIALS_JSON is valid one-line JSON without outer quotes."
            )
            self.service = None
    
    def upload_file(self, file_content, file_name, mime_type, folder_id=None):
        """
        Upload a file to Google Drive
        
        Args:
            file_content: File content (bytes or file-like object)
            file_name: Name of the file
            mime_type: MIME type of the file
            folder_id: Optional folder ID to upload to
        
        Returns:
            dict: File metadata including id, name, webViewLink, webContentLink
        """
        if not self.service:
            raise Exception("Google Drive service not initialized")
        
        try:
            # Prepare file metadata
            file_metadata = {
                'name': file_name,
            }
            
            # Add to folder if specified
            if folder_id:
                file_metadata['parents'] = [folder_id]
            
            # Create media upload
            if isinstance(file_content, bytes):
                media = MediaIoBaseUpload(
                    io.BytesIO(file_content),
                    mimetype=mime_type,
                    resumable=True
                )
            else:
                media = MediaIoBaseUpload(
                    file_content,
                    mimetype=mime_type,
                    resumable=True
                )
            
            # Upload file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink, webContentLink, size, mimeType'
            ).execute()
            
            # Make file publicly accessible (optional - configure based on needs)
            if settings.GOOGLE_DRIVE_PUBLIC_FILES:
                self._make_file_public(file['id'])
            
            return {
                'id': file.get('id'),
                'name': file.get('name'),
                'view_link': file.get('webViewLink'),
                'download_link': file.get('webContentLink'),
                'size': file.get('size'),
                'mime_type': file.get('mimeType')
            }
            
        except Exception as e:
            print(f"Error uploading file to Google Drive: {e}")
            raise
    
    def _make_file_public(self, file_id):
        """Make a file publicly accessible"""
        try:
            permission = {
                'type': 'anyone',
                'role': 'reader'
            }
            self.service.permissions().create(
                fileId=file_id,
                body=permission
            ).execute()
        except Exception as e:
            print(f"Error making file public: {e}")
    
    def delete_file(self, file_id):
        """Delete a file from Google Drive"""
        if not self.service:
            raise Exception("Google Drive service not initialized")
        
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file from Google Drive: {e}")
            return False
    
    def get_file_metadata(self, file_id):
        """Get file metadata"""
        if not self.service:
            raise Exception("Google Drive service not initialized")
        
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields='id, name, webViewLink, webContentLink, size, mimeType'
            ).execute()
            return file
        except Exception as e:
            print(f"Error getting file metadata: {e}")
            return None
    
    def create_folder(self, folder_name, parent_folder_id=None):
        """Create a folder in Google Drive"""
        if not self.service:
            raise Exception("Google Drive service not initialized")
        
        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            folder = self.service.files().create(
                body=file_metadata,
                fields='id, name'
            ).execute()
            
            return folder
        except Exception as e:
            print(f"Error creating folder: {e}")
            return None


# Singleton instance
_drive_service = None

def get_drive_service():
    """Get or create Google Drive service instance"""
    global _drive_service
    if _drive_service is None:
        _drive_service = GoogleDriveService()
    return _drive_service
