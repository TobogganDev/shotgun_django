from rest_framework import generics, permissions
from .models import Registration
from .serializers import RegistrationSerializer


class MyTicketsView(generics.ListAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Registration.objects.filter(user=self.request.user).select_related('event')
