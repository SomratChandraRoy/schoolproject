from django.db import migrations, models


def sync_review_status_from_is_known(apps, schema_editor):
    Flashcard = apps.get_model('academics', 'Flashcard')
    Flashcard.objects.filter(is_known=True).update(review_status='known')
    Flashcard.objects.filter(is_known=False).update(review_status='unknown')


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_flashcarddeck_flashcard'),
    ]

    operations = [
        migrations.AddField(
            model_name='flashcard',
            name='review_status',
            field=models.CharField(
                choices=[
                    ('unknown', 'Unknown'),
                    ('pending', 'Pending'),
                    ('known', 'Known'),
                ],
                default='unknown',
                max_length=20,
            ),
        ),
        migrations.RunPython(sync_review_status_from_is_known, noop_reverse),
    ]
