from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from events.views import EventViewSet
from tickets.views import MyTicketsView, TicketQRView, CancelRegistrationView

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('accounts.urls')),
    path('api/tickets/mine/', MyTicketsView.as_view(), name='my-tickets'),
    path('api/tickets/<uuid:ticket_code>/qr/', TicketQRView.as_view(), name='ticket-qr'),
    path('api/tickets/<int:pk>/cancel/', CancelRegistrationView.as_view(), name='ticket-cancel'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
