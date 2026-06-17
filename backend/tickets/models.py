import uuid
from django.db import models
from django.contrib.auth.models import User
from events.models import Event


class Registration(models.Model):
    STATUS = [('pending', 'En attente'), ('confirmed', 'Confirmé'), ('cancelled', 'Annulé')]
    event = models.ForeignKey(Event, related_name='registrations', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    quantity = models.PositiveIntegerField(default=1)
    ticket_code = models.UUIDField(default=uuid.uuid4, unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)
