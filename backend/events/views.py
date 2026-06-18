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

    @action(detail=True, methods=['get'], url_path='registrants', permission_classes=[permissions.IsAuthenticated])
    def registrants(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user:
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        from tickets.serializers import RegistrantSerializer
        queryset = event.registrations.select_related('user').order_by('-registered_at')
        return Response(RegistrantSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_interests(self, request):
        events = request.user.interested_events.filter(is_published=True).order_by('-created_at')
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def interest(self, request, pk=None):
        event = self.get_object()
        user = request.user
        if event.interested_users.filter(pk=user.pk).exists():
            event.interested_users.remove(user)
            interested = False
        else:
            event.interested_users.add(user)
            interested = True
        return Response({'interested': interested, 'interested_count': event.interested_users.count()})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()

        if event.is_sold_out:
            return Response(
                {'detail': "Cet événement est complet.", 'waitlist_available': True},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Registration.objects.filter(event=event, user=request.user, status='confirmed').exists():
            return Response({'detail': "Vous êtes déjà inscrit à cet événement."}, status=status.HTTP_400_BAD_REQUEST)

        registration = Registration.objects.create(
            event=event,
            user=request.user,
            status='confirmed',
        )
        return Response({'detail': "Inscription confirmée.", 'ticket_code': str(registration.ticket_code)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join_waitlist(self, request, pk=None):
        from tickets.models import WaitlistEntry
        event = self.get_object()

        if not event.is_sold_out:
            return Response({'detail': "L'événement n'est pas complet. Inscrivez-vous directement."}, status=status.HTTP_400_BAD_REQUEST)

        if Registration.objects.filter(event=event, user=request.user, status='confirmed').exists():
            return Response({'detail': "Vous êtes déjà inscrit à cet événement."}, status=status.HTTP_400_BAD_REQUEST)

        entry, created = WaitlistEntry.objects.get_or_create(event=event, user=request.user)
        if not created:
            return Response({'detail': "Vous êtes déjà sur la liste d'attente."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': "Ajouté à la liste d'attente.", 'position': entry.position}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def leave_waitlist(self, request, pk=None):
        from tickets.models import WaitlistEntry
        event = self.get_object()

        deleted, _ = WaitlistEntry.objects.filter(event=event, user=request.user).delete()
        if not deleted:
            return Response({'detail': "Vous n'êtes pas sur la liste d'attente."}, status=status.HTTP_404_NOT_FOUND)

        return Response({'detail': "Retiré de la liste d'attente."})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def waitlist_position(self, request, pk=None):
        from tickets.models import WaitlistEntry
        event = self.get_object()

        try:
            entry = WaitlistEntry.objects.get(event=event, user=request.user)
        except WaitlistEntry.DoesNotExist:
            return Response({'detail': "Vous n'êtes pas sur la liste d'attente."}, status=status.HTTP_404_NOT_FOUND)

        return Response({'position': entry.position, 'joined_at': entry.joined_at})
