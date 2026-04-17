from rest_framework import serializers
from .models import Book, Bookmark, Syllabus


class BookSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    pdf_view_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'class_level',
            'category',
            'language',
            'pdf_file',
            'cover_image',
            'drive_file_id',
            'drive_view_link',
            'drive_download_link',
            'description',
            'uploaded_at',
            'pdf_url',
            'pdf_view_url',
            'cover_image_url',
        ]
        read_only_fields = ('uploaded_at', 'drive_file_id', 'drive_view_link', 'drive_download_link')

    def _build_absolute_url(self, url: str) -> str:
        request = self.context.get('request')
        if request and url and not url.startswith('http'):
            return request.build_absolute_uri(url)
        return url

    def get_pdf_url(self, obj: Book):
        if obj.drive_download_link:
            return obj.drive_download_link
        if obj.pdf_file:
            return self._build_absolute_url(obj.pdf_file.url)
        return None

    def get_pdf_view_url(self, obj: Book):
        if obj.drive_view_link:
            return obj.drive_view_link
        return self.get_pdf_url(obj)

    def get_cover_image_url(self, obj: Book):
        if obj.cover_image:
            return self._build_absolute_url(obj.cover_image.url)
        return None


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'
        read_only_fields = ('user',)


class SyllabusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = '__all__'