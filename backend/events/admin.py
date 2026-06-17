from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'location', 'capacity', 'is_published', 'organizer')
    list_filter = ('is_published',)
    list_editable = ('is_published',)
