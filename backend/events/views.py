from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from tickets.models import Registration
from .models import Event
from .serializers import EventSerializer


class IsOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.profile.role == 'organizer'


class IsEventOrganizer(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = (IsOrganizer, IsEventOrganizer)

    def get_queryset(self):
        if self.action == 'list':
            qs = Event.objects.filter(is_published=True)
            if self.request.user.is_authenticated:
                qs = (qs | Event.objects.filter(organizer=self.request.user)).distinct()
            return qs
        return Event.objects.all()

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()

        if event.is_sold_out:
            return Response({'detail': "Cet événement est complet."}, status=status.HTTP_400_BAD_REQUEST)

        if Registration.objects.filter(event=event, user=request.user, status='confirmed').exists():
            return Response({'detail': "Vous êtes déjà inscrit à cet événement."}, status=status.HTTP_400_BAD_REQUEST)

        registration = Registration.objects.create(
            event=event,
            user=request.user,
            status='confirmed',
        )
        return Response({'detail': "Inscription confirmée.", 'ticket_code': str(registration.ticket_code)}, status=status.HTTP_201_CREATED)
