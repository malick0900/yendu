"""Seed Teranga Stay with realistic demo content (admin user, destinations, properties, experiences)."""
import asyncio
from datetime import datetime, timezone
import uuid

from db import db
from auth_utils import hash_password


ADMIN_EMAIL = "admin@terangastay.sn"
ADMIN_PASSWORD = "Admin123!"
TRAVELER_EMAIL = "traveler@example.com"
TRAVELER_PASSWORD = "Traveler123!"


DESTINATIONS = [
    {
        "name": "Dakar",
        "slug": "dakar",
        "tagline": "Énergie urbaine & Atlantique",
        "short_description": "La capitale vibrante du Sénégal, entre mer, art et nuits effervescentes.",
        "description": "Dakar est une métropole côtière vivante où se mêlent galeries d’art contemporain, marchés colorés, scnes musicales et plages d’Atlantique. Ses quartiers — N’Gor, Les Almadies, Médina — racontent chacun une facette unique de la ville.",
        "hero_image": "https://images.unsplash.com/photo-1716997338016-93b456b3ea8f?w=1600&auto=format&fit=crop",
    },
    {
        "name": "Saly",
        "slug": "saly",
        "tagline": "Plages dorées & douceur de vivre",
        "short_description": "La station balnéaire phare de la Petite Côte, palmiers et eaux turquoise.",
        "description": "Saly est un écrin balnéaire où les plages de sable fin rencontrent une atmosphère tropicale et raffinée. Idéale pour les escapades en famille ou en couple, entre piscines, sports nautiques et tables raffinées.",
        "hero_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop",
    },
    {
        "name": "Casamance",
        "slug": "casamance",
        "tagline": "Mangroves & cultures vivantes",
        "short_description": "Une région luxuriante au sud, entre forêts, fleuves et villages diolas.",
        "description": "La Casamance, c’est la nature à l’état pur : mangroves, palmeraies, plages secrètes et villages enchanteurs. Une immersion authentique au cœur de l’hospitalité africaine.",
        "hero_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&auto=format&fit=crop",
    },
    {
        "name": "Saint-Louis",
        "slug": "saint-louis",
        "tagline": "Héritage colonial & jazz",
        "short_description": "Ancienne capitale classée UNESCO, charme intemporel et culture jazz.",
        "description": "Saint-Louis, lovée entre fleuve et océan, séduit par son architecture coloniale, ses ruelles poétiques et son festival de jazz mondialement connu.",
        "hero_image": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&auto=format&fit=crop",
    },
]


# Curated stock images by category (reused via index)
PROPERTY_IMAGES = {
    "villa": [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop",
    ],
    "villa_interior": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&auto=format&fit=crop",
    ],
    "apartment": [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop",
    ],
    "riad": [
        "https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=1200&auto=format&fit=crop",
    ],
    "beach": [
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop",
    ],
    "guesthouse": [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop",
    ],
}

EXPERIENCE_IMAGES = {
    "culture": [
        "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop",
    ],
    "gastronomie": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200&auto=format&fit=crop",
    ],
    "aventure": [
        "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&auto=format&fit=crop",
    ],
    "nightlife": [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=1200&auto=format&fit=crop",
    ],
    "lifestyle": [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517825738774-7de9363ef735?w=1200&auto=format&fit=crop",
    ],
}


PROPERTIES = [
    # Dakar
    {
        "title": "Villa Atlantique aux Almadies",
        "description": "Une villa contemporaine à deux pas de l’océan, terrasse panoramique, piscine à débordement et intérieurs lumineux décorés par un designer dakarois.",
        "destination_slug": "dakar", "city": "Dakar", "address": "Les Almadies, Dakar",
        "lat": 14.7397, "lng": -17.5079, "type": "villa",
        "price_per_night": 185000, "max_guests": 6, "bedrooms": 3, "beds": 3, "bathrooms": 3,
        "amenities": ["Wifi", "Piscine", "Climatisation", "Vue mer", "Parking", "Cuisine équipée"],
        "images": PROPERTY_IMAGES["villa"] + PROPERTY_IMAGES["villa_interior"],
        "is_premium": True,
    },
    {
        "title": "Appartement design à N’Gor",
        "description": "Loft moderne, balcon avec vue sur la baie, parfait pour un city break entre culture et baignade.",
        "destination_slug": "dakar", "city": "Dakar", "address": "N’Gor Village, Dakar",
        "lat": 14.7491, "lng": -17.5125, "type": "apartment",
        "price_per_night": 72000, "max_guests": 3, "bedrooms": 1, "beds": 1, "bathrooms": 1,
        "amenities": ["Wifi", "Climatisation", "Balcon", "Cuisine équipée"],
        "images": PROPERTY_IMAGES["apartment"],
        "is_premium": False,
    },
    {
        "title": "Suite des arts à la Médina",
        "description": "Suite élégante au cœur de la Médina, immersion artistique et nuits sereines.",
        "destination_slug": "dakar", "city": "Dakar", "address": "Médina, Dakar",
        "lat": 14.6849, "lng": -17.4575, "type": "riad",
        "price_per_night": 58000, "max_guests": 2, "bedrooms": 1, "beds": 1, "bathrooms": 1,
        "amenities": ["Wifi", "Climatisation", "Petit-déjeuner inclus"],
        "images": PROPERTY_IMAGES["riad"],
        "is_premium": False,
    },
    # Saly
    {
        "title": "Villa Pieds-dans-l’eau Saly",
        "description": "Accès direct à la plage, jardin tropical et hamacs sous les palmiers.",
        "destination_slug": "saly", "city": "Saly", "address": "Saly Portudal",
        "lat": 14.4503, "lng": -17.0048, "type": "villa",
        "price_per_night": 220000, "max_guests": 8, "bedrooms": 4, "beds": 5, "bathrooms": 3,
        "amenities": ["Wifi", "Piscine", "Climatisation", "Vue mer", "Accès plage", "Cuisine équipée"],
        "images": PROPERTY_IMAGES["villa"] + PROPERTY_IMAGES["beach"],
        "is_premium": True,
    },
    {
        "title": "Bungalow tropical Saly",
        "description": "Bungalow indépendant en bord de mer, cocon parfait pour deux.",
        "destination_slug": "saly", "city": "Saly", "address": "Saly",
        "lat": 14.4441, "lng": -17.0118, "type": "guesthouse",
        "price_per_night": 95000, "max_guests": 2, "bedrooms": 1, "beds": 1, "bathrooms": 1,
        "amenities": ["Wifi", "Climatisation", "Petit-déjeuner inclus", "Accès plage"],
        "images": PROPERTY_IMAGES["guesthouse"],
        "is_premium": False,
    },
    {
        "title": "Appartement résidence Saly",
        "description": "Résidence sécurisée avec piscine commune, à quelques minutes de la plage.",
        "destination_slug": "saly", "city": "Saly", "address": "Saly",
        "lat": 14.4536, "lng": -17.0017, "type": "apartment",
        "price_per_night": 68000, "max_guests": 4, "bedrooms": 2, "beds": 2, "bathrooms": 1,
        "amenities": ["Wifi", "Piscine", "Climatisation", "Parking"],
        "images": PROPERTY_IMAGES["apartment"],
        "is_premium": False,
    },
    # Casamance
    {
        "title": "Lodge sur le fleuve Casamance",
        "description": "Lodge en bois niché dans les mangroves, balades en pirogue à l’aube.",
        "destination_slug": "casamance", "city": "Ziguinchor", "address": "Casamance",
        "lat": 12.5775, "lng": -16.2719, "type": "guesthouse",
        "price_per_night": 78000, "max_guests": 4, "bedrooms": 2, "beds": 2, "bathrooms": 2,
        "amenities": ["Wifi", "Petit-déjeuner inclus", "Vue nature", "Pirogue"],
        "images": PROPERTY_IMAGES["guesthouse"] + PROPERTY_IMAGES["beach"],
        "is_premium": True,
    },
    {
        "title": "Case traditionnelle à Cap Skirring",
        "description": "Case en banco repensée, matériaux nobles, hospitalité diola.",
        "destination_slug": "casamance", "city": "Cap Skirring", "address": "Cap Skirring",
        "lat": 12.3933, "lng": -16.7458, "type": "villa",
        "price_per_night": 110000, "max_guests": 5, "bedrooms": 2, "beds": 3, "bathrooms": 2,
        "amenities": ["Wifi", "Climatisation", "Accès plage", "Petit-déjeuner inclus"],
        "images": PROPERTY_IMAGES["villa"] + PROPERTY_IMAGES["beach"],
        "is_premium": True,
    },
    # Saint-Louis
    {
        "title": "Maison coloniale îÎle Saint-Louis",
        "description": "Demeure historique rénovée, patio fleuri, biblothèque jazz.",
        "destination_slug": "saint-louis", "city": "Saint-Louis", "address": "Île de Saint-Louis",
        "lat": 16.0297, "lng": -16.5089, "type": "villa",
        "price_per_night": 96000, "max_guests": 4, "bedrooms": 2, "beds": 3, "bathrooms": 2,
        "amenities": ["Wifi", "Climatisation", "Petit-déjeuner inclus", "Patrimoine UNESCO"],
        "images": PROPERTY_IMAGES["riad"] + PROPERTY_IMAGES["villa_interior"],
        "is_premium": True,
    },
    {
        "title": "Studio Vue Fleuve Saint-Louis",
        "description": "Studio avec vue sur le fleuve, calme et lumineux.",
        "destination_slug": "saint-louis", "city": "Saint-Louis", "address": "Saint-Louis",
        "lat": 16.0205, "lng": -16.5023, "type": "apartment",
        "price_per_night": 45000, "max_guests": 2, "bedrooms": 1, "beds": 1, "bathrooms": 1,
        "amenities": ["Wifi", "Climatisation", "Vue fleuve"],
        "images": PROPERTY_IMAGES["apartment"],
        "is_premium": False,
    },
]


EXPERIENCES = [
    {
        "title": "Visite guidée de l’Île de Gorée",
        "description": "Une journée immersive sur l’Île mémoire, accompagnée d’un historien snégalais.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.6669, "lng": -17.3982,
        "category": "culture", "duration_hours": 5.0, "price": 28000, "max_participants": 10,
        "included": ["Transport ferry", "Guide historien", "Eau"],
        "meeting_point": "Embarcadère du Port de Dakar",
        "host_name": "Cheikh Diop", "host_bio": "Historien et guide certifié, passionné par la mémoire africaine.",
        "host_avatar": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["culture"],
        "is_trending": True,
    },
    {
        "title": "Dégustation gastronomique sénégalaise",
        "description": "Atelier cuisine + repas autour du thiébou dieune, mafe et bissap maison.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.7167, "lng": -17.4677,
        "category": "gastronomie", "duration_hours": 3.5, "price": 22000, "max_participants": 8,
        "included": ["Ingrédients", "Recettes", "Repas complet", "Boissons"],
        "meeting_point": "Atelier Saveurs Teranga, Plateau",
        "host_name": "Awa Ndiaye", "host_bio": "Chef cuisinière, ambassadrice de la cuisine sénégalaise moderne.",
        "host_avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["gastronomie"],
        "is_trending": True,
    },
    {
        "title": "Nuit jazz à Saint-Louis",
        "description": "Une soirée VIP dans un club mythique, sets live et cocktails signés.",
        "destination_slug": "saint-louis", "city": "Saint-Louis", "lat": 16.0286, "lng": -16.5093,
        "category": "nightlife", "duration_hours": 4.0, "price": 18000, "max_participants": 20,
        "included": ["Entrée VIP", "2 cocktails", "Hote/Hôtesse"],
        "meeting_point": "Club Saint-Louis Jazz, Place Faidherbe",
        "host_name": "Mamadou Sow", "host_bio": "Programmateur du festival international de jazz.",
        "host_avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["nightlife"],
        "is_trending": False,
    },
    {
        "title": "Surf coaching à N’Gor",
        "description": "Session de surf avec coach pro, matériel inclus, niveau débutant à intermédiaire.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.7553, "lng": -17.5147,
        "category": "aventure", "duration_hours": 2.5, "price": 25000, "max_participants": 6,
        "included": ["Planche", "Combinaison", "Coach certifié"],
        "meeting_point": "Plage de N’Gor",
        "host_name": "Modou Fall", "host_bio": "Champion national de surf, coach depuis 10 ans.",
        "host_avatar": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["aventure"],
        "is_trending": True,
    },
    {
        "title": "Excursion pirogue mangrove Casamance",
        "description": "Balade au cœur des mangroves, découverte des oiseaux et villages riverains.",
        "destination_slug": "casamance", "city": "Ziguinchor", "lat": 12.5681, "lng": -16.2719,
        "category": "aventure", "duration_hours": 5.0, "price": 32000, "max_participants": 8,
        "included": ["Pirogue", "Guide local", "Déjeuner village", "Eau"],
        "meeting_point": "Port de Ziguinchor",
        "host_name": "Ousmane Diatta", "host_bio": "Guide diola, expert des écosystèmes de Casamance.",
        "host_avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["aventure"],
        "is_trending": True,
    },
    {
        "title": "Yoga & sunset sur la plage de Saly",
        "description": "Séance de yoga au coucher du soleil, suivie d’un thé attaya.",
        "destination_slug": "saly", "city": "Saly", "lat": 14.4503, "lng": -17.0048,
        "category": "lifestyle", "duration_hours": 1.5, "price": 12000, "max_participants": 15,
        "included": ["Tapis", "Thé attaya", "Coach yoga"],
        "meeting_point": "Plage de Saly Portudal",
        "host_name": "Fatou Mbaye", "host_bio": "Professeure de yoga certifiée et coach bien-être.",
        "host_avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["lifestyle"],
        "is_trending": False,
    },
    {
        "title": "Atelier percussion Sabar",
        "description": "Découvrez le rythme sénégalais avec un griot, instrument fourni.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.6928, "lng": -17.4467,
        "category": "culture", "duration_hours": 2.0, "price": 16000, "max_participants": 12,
        "included": ["Sabar", "Coaching", "Démonstration"],
        "meeting_point": "Centre culturel de la Médina",
        "host_name": "Pape Diouf", "host_bio": "Percussionniste griot, héritier d’une famille de musiciens.",
        "host_avatar": "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["culture"],
        "is_trending": False,
    },
    {
        "title": "Soirée mbalax à Dakar",
        "description": "Concert live mbalax + dancefloor, l’âme musicale du Sénégal.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.6928, "lng": -17.4467,
        "category": "nightlife", "duration_hours": 5.0, "price": 20000, "max_participants": 30,
        "included": ["Entrée", "Welcome drink"],
        "meeting_point": "Club Just 4 U, Dakar",
        "host_name": "Aminata Sall", "host_bio": "DJ et programmatrice nuits dakaroises.",
        "host_avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["nightlife"],
        "is_trending": True,
    },
    {
        "title": "Dîner sur la plage étoilée",
        "description": "Dîner gastronomique privé sur la plage, pieds dans le sable.",
        "destination_slug": "saly", "city": "Saly", "lat": 14.4503, "lng": -17.0048,
        "category": "gastronomie", "duration_hours": 3.0, "price": 45000, "max_participants": 4,
        "included": ["Menu 4 plats", "Vins", "Service privé"],
        "meeting_point": "Plage de Saly",
        "host_name": "Chef Ibrahim", "host_bio": "Chef étoilé, spécialiste cuisine fusion ouest-africaine.",
        "host_avatar": "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["gastronomie"],
        "is_trending": True,
    },
    {
        "title": "Spa & rituel beauté africaine",
        "description": "Soin complet aux beurres de karité et huiles essentielles locales.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.7397, "lng": -17.5079,
        "category": "lifestyle", "duration_hours": 2.0, "price": 35000, "max_participants": 1,
        "included": ["Massage 60min", "Gommage", "Thé"],
        "meeting_point": "Spa Les Almadies",
        "host_name": "Adama Bah", "host_bio": "Praticienne certifiée en soins traditionnels africains.",
        "host_avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["lifestyle"],
        "is_trending": False,
    },
    {
        "title": "Photo safari Lac Rose",
        "description": "Journée photo au mythique Lac Rose, coucher de soleil garanti.",
        "destination_slug": "dakar", "city": "Dakar", "lat": 14.8400, "lng": -17.2353,
        "category": "aventure", "duration_hours": 6.0, "price": 38000, "max_participants": 6,
        "included": ["4x4", "Guide photographe", "Déjeuner"],
        "meeting_point": "Hôtel Pullman Dakar",
        "host_name": "Khadim Niang", "host_bio": "Photographe et guide aventure depuis 12 ans.",
        "host_avatar": "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["aventure"],
        "is_trending": True,
    },
    {
        "title": "Atelier teinture indigo bogolan",
        "description": "Apprenez l’art ancestral de la teinture africaine et repartez avec votre création.",
        "destination_slug": "casamance", "city": "Ziguinchor", "lat": 12.5681, "lng": -16.2719,
        "category": "culture", "duration_hours": 3.0, "price": 20000, "max_participants": 8,
        "included": ["Tissus", "Teintures", "Coaching artisan"],
        "meeting_point": "Atelier Bogolan Ziguinchor",
        "host_name": "Mariama Sagna", "host_bio": "Artisane teinturière depuis 20 ans.",
        "host_avatar": "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400&auto=format&fit=crop",
        "images": EXPERIENCE_IMAGES["culture"],
        "is_trending": False,
    },
]


async def _ensure_user(email: str, password: str, name: str, role: str) -> str:
    existing = await db.users.find_one({"email": email})
    if existing:
        await db.users.update_one({"email": email}, {"$set": {"role": role}})
        return existing["user_id"]
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "avatar": None,
        "phone": None,
        "role": role,
        "provider": "email",
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return user_id


async def seed():
    # Users
    await _ensure_user(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin Teranga", "ADMIN")
    await _ensure_user(TRAVELER_EMAIL, TRAVELER_PASSWORD, "Voyageur Demo", "TRAVELER")

    # Destinations
    for d in DESTINATIONS:
        existing = await db.destinations.find_one({"slug": d["slug"]})
        if existing:
            continue
        doc = {
            **d,
            "id": uuid.uuid4().hex[:16],
            "country": "Sénégal",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.destinations.insert_one(doc)

    # Properties
    for p in PROPERTIES:
        existing = await db.properties.find_one({"title": p["title"]})
        if existing:
            continue
        doc = {
            **p,
            "id": uuid.uuid4().hex[:16],
            "is_published": True,
            "rating_avg": round(4.6 + (hash(p["title"]) % 5) / 10.0, 2),
            "rating_count": 10 + (hash(p["title"]) % 80),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.properties.insert_one(doc)

    # Experiences
    for e in EXPERIENCES:
        existing = await db.experiences.find_one({"title": e["title"]})
        if existing:
            continue
        doc = {
            **e,
            "id": uuid.uuid4().hex[:16],
            "is_published": True,
            "rating_avg": round(4.5 + (hash(e["title"]) % 6) / 10.0, 2),
            "rating_count": 8 + (hash(e["title"]) % 60),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.experiences.insert_one(doc)

    print("Seed terminated.")


if __name__ == "__main__":
    asyncio.run(seed())
