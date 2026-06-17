from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    is_sold_out = serializers.BooleanField(read_only=True)
    spots_left = serializers.SerializerMethodField()
    organizer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'organizer',
            'date', 'end_date', 'location', 'cover_image', 'capacity',
            'price', 'is_published', 'created_at',
            'is_sold_out', 'spots_left',
        )
        read_only_fields = ('created_at',)

    def get_spots_left(self, obj):
        confirmed = obj.registrations.filter(status='confirmed').count()
        return max(0, obj.capacity - confirmed)
