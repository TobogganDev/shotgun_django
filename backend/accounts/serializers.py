from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['organizer', 'attendee'], default='attendee', write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def create(self, validated_data):
        role = validated_data.pop('role', 'attendee')
        user = User.objects.create_user(**validated_data)
        user.profile.role = role
        user.profile.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined', 'role')
