import random
import shutil
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from events.models import Event
from tickets.models import Registration

# Demo images shipped with the repo (committed). They are copied into MEDIA_ROOT
# at seed time so they are served like normal uploads without committing MEDIA_ROOT.
SEED_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / 'seed_images'


ORGANIZERS = [
    ('alice_organizer', 'alice@example.com', 'Alice', 'Martin'),
    ('bob_organizer', 'bob@example.com', 'Bob', 'Durand'),
]

ATTENDEES = [
    ('charlie', 'charlie@example.com', 'Charlie', 'Petit'),
    ('diana', 'diana@example.com', 'Diana', 'Lefevre'),
    ('ethan', 'ethan@example.com', 'Ethan', 'Moreau'),
    ('fiona', 'fiona@example.com', 'Fiona', 'Garcia'),
    ('george', 'george@example.com', 'George', 'Bernard'),
]

EVENTS = [
    {
        'title': 'Festival Électro Nuit Blanche',
        'description': 'Une nuit entière de musique électronique avec les meilleurs DJ internationaux. '
                       'Line-up exceptionnel, scène immersive et ambiance unique au cœur de la ville.',
        'location': 'Halle Tony Garnier, Lyon',
        'capacity': 2000,
        'price': 45.00,
        'days_from_now': 14,
        'duration_hours': 8,
        'image': 'events/festival-electro.jpg',
    },
    {
        'title': 'Conférence Tech & IA 2026',
        'description': 'Découvrez les dernières avancées en intelligence artificielle. '
                       'Talks, ateliers pratiques et networking avec les acteurs majeurs de la tech.',
        'location': 'Palais des Congrès, Paris',
        'capacity': 500,
        'price': 120.00,
        'days_from_now': 30,
        'duration_hours': 9,
        'image': 'events/conference-tech.jpg',
    },
    {
        'title': 'Concert Jazz au Sunset',
        'description': 'Une soirée intimiste dédiée au jazz avec un quartet de renom. '
                       'Cocktails, ambiance feutrée et improvisations à couper le souffle.',
        'location': 'Le Sunset, Paris',
        'capacity': 120,
        'price': 28.50,
        'days_from_now': 7,
        'duration_hours': 3,
        'image': 'events/concert-jazz.jpg',
    },
    {
        'title': 'Marché des Créateurs',
        'description': 'Rencontrez plus de 80 artisans et créateurs locaux. '
                       'Entrée gratuite, ateliers pour enfants et food trucks sur place.',
        'location': 'Place Bellecour, Lyon',
        'capacity': 1000,
        'price': 0.00,
        'days_from_now': 21,
        'duration_hours': 6,
        'image': 'events/marche-createurs.jpg',
    },
    {
        'title': 'Atelier Cuisine Italienne',
        'description': 'Apprenez à réaliser des pâtes fraîches et tiramisu maison avec un chef italien. '
                       'Petit groupe, dégustation incluse.',
        'location': 'Atelier des Saveurs, Marseille',
        'capacity': 16,
        'price': 75.00,
        'days_from_now': 10,
        'duration_hours': 3,
        'image': 'events/atelier-cuisine.jpg',
    },
    {
        'title': 'Soirée passée — Stand-up Comedy',
        'description': 'Un plateau de jeunes humoristes pour une soirée 100% rire. (Événement passé)',
        'location': 'Le Comedy Club, Paris',
        'capacity': 200,
        'price': 22.00,
        'days_from_now': -5,
        'duration_hours': 2,
        'image': 'events/standup-comedy.jpg',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with mock users, events and registrations for demo purposes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete existing seeded data (events, registrations, demo users) before seeding.',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self._flush()

        self._copy_images()
        organizers = self._create_users(ORGANIZERS, role='organizer')
        attendees = self._create_users(ATTENDEES, role='attendee')

        events = self._create_events(organizers)
        self._create_registrations(events, attendees)

        self.stdout.write(self.style.SUCCESS(
            f'\nSeed complete: {len(organizers)} organizers, {len(attendees)} attendees, '
            f'{len(events)} events, {Registration.objects.count()} registrations.'
        ))
        self.stdout.write('Demo login password for all seeded users: "password123"')

    def _flush(self):
        self.stdout.write('Flushing existing seeded data...')
        demo_usernames = [u[0] for u in ORGANIZERS + ATTENDEES]
        Registration.objects.all().delete()
        Event.objects.all().delete()
        User.objects.filter(username__in=demo_usernames).delete()

    def _copy_images(self):
        """Copy committed demo images from seed_images/ into MEDIA_ROOT/events/."""
        dest_dir = Path(settings.MEDIA_ROOT) / 'events'
        dest_dir.mkdir(parents=True, exist_ok=True)
        for image in SEED_IMAGES_DIR.glob('*.jpg'):
            shutil.copy2(image, dest_dir / image.name)
        self.stdout.write(f'  copied demo images to {dest_dir}')

    def _create_users(self, specs, role):
        users = []
        for username, email, first, last in specs:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'first_name': first, 'last_name': last},
            )
            if created:
                user.set_password('password123')
                user.save()
            # Profile is auto-created by signal; ensure the role is set.
            profile = user.profile
            if profile.role != role:
                profile.role = role
                profile.save()
            users.append(user)
            self.stdout.write(f'  user: {username} ({role}){"" if created else " [exists]"}')
        return users

    def _create_events(self, organizers):
        now = timezone.now()
        events = []
        for spec in EVENTS:
            organizer = random.choice(organizers)
            start = now + timedelta(days=spec['days_from_now'])
            event, created = Event.objects.get_or_create(
                title=spec['title'],
                defaults={
                    'description': spec['description'],
                    'organizer': organizer,
                    'date': start,
                    'end_date': start + timedelta(hours=spec['duration_hours']),
                    'location': spec['location'],
                    'capacity': spec['capacity'],
                    'price': spec['price'],
                    'is_published': True,
                    'cover_image': spec['image'],
                },
            )
            events.append(event)
            self.stdout.write(f'  event: {event.title}{"" if created else " [exists]"}')
        return events

    def _create_registrations(self, events, attendees):
        statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled']
        for event in events:
            # Register a random subset of attendees for each event.
            sample = random.sample(attendees, k=random.randint(2, len(attendees)))
            for attendee in sample:
                Registration.objects.get_or_create(
                    event=event,
                    user=attendee,
                    defaults={
                        'status': random.choice(statuses),
                        'quantity': random.randint(1, 3),
                    },
                )
