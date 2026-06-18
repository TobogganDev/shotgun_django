from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from events.views import EventViewSet
from tickets.views import MyTicketsView, MyWaitlistView, TicketQRView, CancelRegistrationView

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('accounts.urls')),
    path('api/tickets/mine/', MyTicketsView.as_view(), name='my-tickets'),
    path('api/tickets/waitlist/', MyWaitlistView.as_view(), name='my-waitlist'),
    path('api/tickets/<uuid:ticket_code>/qr/', TicketQRView.as_view(), name='ticket-qr'),
    path('api/tickets/<int:pk>/cancel/', CancelRegistrationView.as_view(), name='ticket-cancel'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
