from django.contrib import admin
from .models import Registration, WaitlistEntry


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'status', 'ticket_code', 'registered_at')
    list_filter = ('status',)


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'position', 'joined_at')
    list_filter = ('event',)
    ordering = ('event', 'joined_at')
