import os

models_path = "../../backend/academics/models.py"
with open(models_path, "a", encoding="utf-8") as f:
    f.write('''

class FlashcardDeck(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_decks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Flashcard(models.Model):
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='cards')
    front = models.TextField(help_text="Question or concept")
    back = models.TextField(help_text="Answer or explanation")
    is_known = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.deck.title}: {self.front[:30]}..."
''')

print("models.py updated")
