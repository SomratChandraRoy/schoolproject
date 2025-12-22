# Generated migration for adding interests field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_user_is_student_alter_note_id_alter_studysession_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='interests',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
