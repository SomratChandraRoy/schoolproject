"""
URL configuration for medhabangla project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/profile/', RedirectView.as_view(url='/admin/', permanent=False)),
    path('api/accounts/', include('accounts.urls')),
    path('api/quizzes/', include('quizzes.urls')),
    path('api/books/', include('books.urls')),
    path('api/games/', include('games.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/translator/', include('translator.urls')),  # English-Bangla Translator
    # Admin API endpoints
    path('api/superuser/accounts/', include('accounts.admin_urls')),
    path('api/superuser/quizzes/', include('quizzes.admin_urls')),
    path('api/superuser/books/', include('books.admin_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)