# Generated manually for Google Drive integration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='drive_file_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='drive_view_link',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='message',
            name='drive_download_link',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
