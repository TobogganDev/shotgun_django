from rest_framework import serializers
from .models import Registration, WaitlistEntry


class EventBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.DateTimeField()
    location = serializers.CharField()


class RegistrationSerializer(serializers.ModelSerializer):
    event = EventBriefSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'event', 'status', 'quantity', 'ticket_code', 'registered_at')


class RegistrantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')

    class Meta:
        model = Registration
        fields = ('id', 'username', 'email', 'status', 'quantity', 'registered_at')


class WaitlistEntrySerializer(serializers.ModelSerializer):
    event = EventBriefSerializer(read_only=True)
    position = serializers.IntegerField(read_only=True)

    class Meta:
        model = WaitlistEntry
        fields = ('id', 'event', 'position', 'joined_at')
