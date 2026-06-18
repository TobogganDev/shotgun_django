import io
import qrcode
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import Registration
from .serializers import RegistrationSerializer


class MyTicketsView(generics.ListAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Registration.objects.filter(user=self.request.user).select_related('event')


class CancelRegistrationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk):
        try:
            registration = Registration.objects.get(pk=pk, user=request.user)
        except Registration.DoesNotExist:
            raise NotFound()
        if registration.status != 'confirmed':
            return Response({'detail': 'Ce billet ne peut pas être annulé.'}, status=status.HTTP_400_BAD_REQUEST)
        registration.status = 'cancelled'
        registration.save()
        return Response({'detail': 'Inscription annulée.'})


class TicketQRView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, ticket_code):
        if not Registration.objects.filter(ticket_code=ticket_code).exists():
            raise NotFound()

        img = qrcode.make(str(ticket_code))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return HttpResponse(buf.getvalue(), content_type='image/png')
