from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0006_alter_book_id_alter_bookmark_id_alter_syllabus_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='drive_download_link',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='book',
            name='drive_file_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='book',
            name='drive_view_link',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
