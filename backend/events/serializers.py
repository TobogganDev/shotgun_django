from rest_framework import serializers
from tickets.models import Registration
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    is_sold_out = serializers.BooleanField(read_only=True)
    spots_left = serializers.SerializerMethodField()
    organizer = serializers.StringRelatedField(read_only=True)
    is_interested = serializers.SerializerMethodField()
    interested_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'organizer',
            'date', 'end_date', 'location', 'cover_image', 'capacity',
            'price', 'is_published', 'created_at',
            'is_sold_out', 'spots_left',
            'is_interested', 'interested_count',
        )
        read_only_fields = ('created_at',)

    def get_spots_left(self, obj):
        confirmed = obj.registrations.filter(status='confirmed').count()
        return max(0, obj.capacity - confirmed)

    def get_is_interested(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interested_users.filter(pk=request.user.pk).exists()
        return False

    def get_interested_count(self, obj):
        return obj.interested_users.count()


class AttendeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'username', 'full_name', 'email', 'status', 'quantity', 'ticket_code', 'registered_at')

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
