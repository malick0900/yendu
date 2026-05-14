{
  "product": {
    "name": "Teranga Stay",
    "tagline": "La plateforme africaine qui permet de vivre une destination, pas seulement d’y dormir.",
    "language": "fr-FR",
    "brand_attributes": [
      "chaleureux",
      "premium",
      "authentique",
      "moderne",
      "immersif",
      "éditorial",
      "fiable"
    ],
    "north_star_experience": "Airbnb-level clarity + editorial African warmth: grandes photos, beaucoup d’air, détails tactiles (textures sable/argile), accents dorés discrets, motifs wax/bogolan en filigrane (jamais en fond de lecture)."
  },

  "design_tokens": {
    "color_system": {
      "notes": [
        "MVP en light mode. Dark mode optionnel (prévoir tokens).",
        "Accent doré = parcimonieux (icônes, badges premium, séparateurs).",
        "Aucune gradient sombre/saturée. Les gradients sont décoratifs et limités à <20% du viewport."
      ],
      "palette_hex": {
        "sand_50": "#FBF7F0",
        "sand_100": "#F4EBDD",
        "sand_200": "#E9D8C2",
        "clay_500": "#C86B4A",
        "clay_600": "#B85B3D",
        "terracotta_700": "#8F3F2B",
        "deep_green_700": "#0F3D2E",
        "deep_green_800": "#0B2E23",
        "charcoal_900": "#141312",
        "ink_800": "#1E2320",
        "white": "#FFFFFF",
        "gold_400": "#D6B25E",
        "gold_500": "#C9A24A",
        "ocean_500": "#2A8C8A",
        "sky_100": "#E7F3F2",
        "danger_600": "#C2412D",
        "success_600": "#1F7A5A",
        "warning_600": "#B7791F"
      },
      "semantic_tokens_css": ":root {\n  /* Base */\n  --bg: 36 56% 97%; /* sand_50 */\n  --fg: 20 8% 8%; /* charcoal_900 */\n\n  --card: 0 0% 100%;\n  --card-fg: 20 8% 8%;\n\n  --muted: 36 35% 92%; /* sand_100 */\n  --muted-fg: 20 6% 35%;\n\n  --border: 32 22% 84%;\n  --input: 32 22% 84%;\n\n  /* Brand */\n  --primary: 12 52% 53%; /* clay_500 */\n  --primary-fg: 0 0% 100%;\n\n  --secondary: 160 60% 15%; /* deep_green_700 */\n  --secondary-fg: 0 0% 98%;\n\n  --accent: 174 54% 35%; /* ocean_500 */\n  --accent-fg: 0 0% 100%;\n\n  --ring: 12 52% 53%;\n\n  /* Premium highlight */\n  --premium: 42 55% 60%; /* gold_400 */\n\n  /* States */\n  --danger: 10 61% 47%;\n  --warning: 35 72% 42%;\n  --success: 160 58% 30%;\n\n  /* Radius */\n  --radius: 14px;\n}\n\n.dark {\n  --bg: 20 8% 8%;\n  --fg: 36 56% 97%;\n  --card: 20 8% 10%;\n  --card-fg: 36 56% 97%;\n  --muted: 20 6% 16%;\n  --muted-fg: 36 10% 75%;\n  --border: 20 6% 22%;\n  --input: 20 6% 22%;\n  --primary: 12 52% 58%;\n  --primary-fg: 20 8% 8%;\n  --secondary: 160 45% 22%;\n  --secondary-fg: 0 0% 98%;\n  --accent: 174 54% 40%;\n  --accent-fg: 20 8% 8%;\n  --ring: 42 55% 60%;\n  --premium: 42 55% 60%;\n  --danger: 10 61% 55%;\n  --warning: 35 72% 55%;\n  --success: 160 58% 40%;\n }",
      "allowed_gradients": {
        "hero_overlay": "linear-gradient(180deg, rgba(20,19,18,0.55) 0%, rgba(20,19,18,0.15) 45%, rgba(251,247,240,0.00) 100%)",
        "section_warm_wash": "radial-gradient(1200px 600px at 20% 0%, rgba(200,107,74,0.14) 0%, rgba(200,107,74,0.00) 60%), radial-gradient(900px 500px at 80% 10%, rgba(42,140,138,0.10) 0%, rgba(42,140,138,0.00) 55%)",
        "cta_soft": "linear-gradient(135deg, rgba(200,107,74,0.18) 0%, rgba(214,178,94,0.14) 55%, rgba(244,235,221,0.00) 100%)"
      },
      "gradient_restriction_rule": {
        "prohibited": [
          "blue-500 to purple-600",
          "purple-500 to pink-500",
          "green-500 to blue-500",
          "red to pink",
          "any dark/saturated gradient combo"
        ],
        "enforcement": "IF gradient area exceeds 20% of viewport OR impacts readability THEN fallback to solid colors or simple, light two-color gradients.",
        "allowed_usage": [
          "Hero section background overlays only",
          "Section background washes (decorative)",
          "Large decorative overlays",
          "Never on text-heavy cards"
        ]
      }
    },

    "typography": {
      "google_fonts": {
        "display": {
          "family": "Gloock",
          "weights": ["400"],
          "usage": "H1/H2, destination titles, editorial quotes"
        },
        "body": {
          "family": "Manrope",
          "weights": ["400", "500", "600", "700"],
          "usage": "UI, paragraphs, labels, dashboards"
        },
        "mono_optional": {
          "family": "Azeret Mono",
          "weights": ["400", "600"],
          "usage": "Admin analytics numbers, codes, IDs"
        }
      },
      "css_scaffold": "/* index.css (top) */\n@import url('https://fonts.googleapis.com/css2?family=Gloock&family=Manrope:wght@400;500;600;700&family=Azeret+Mono:wght@400;600&display=swap');\n\n:root{\n  --font-display: 'Gloock', ui-serif, Georgia, serif;\n  --font-body: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;\n  --font-mono: 'Azeret Mono', ui-monospace, SFMono-Regular, Menlo, monospace;\n}\n\nbody{ font-family: var(--font-body); }\n\nh1,h2,.font-display{ font-family: var(--font-display); }",
      "type_scale_tailwind": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight",
        "h2": "text-2xl sm:text-3xl font-display tracking-tight",
        "h3": "text-xl sm:text-2xl font-semibold",
        "subheading": "text-base md:text-lg text-muted-foreground",
        "body": "text-sm md:text-base leading-relaxed",
        "caption": "text-xs text-muted-foreground"
      },
      "copy_tone_fr": {
        "principles": [
          "Court, sensoriel, concret",
          "Mettre en avant le lieu (quartier, ambiance, expérience)",
          "Éviter le jargon touristique"
        ],
        "examples": {
          "hero": "Où part-on au Sénégal ?",
          "cta_primary": "Explorer les hébergements",
          "cta_secondary": "Découvrir les expériences",
          "trust": "Paiement simulé — confirmation manuelle par l’équipe Teranga Stay"
        }
      }
    },

    "spacing_grid": {
      "layout": {
        "container": "max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        "section_padding": "py-10 sm:py-14 lg:py-20",
        "stack": {
          "xs": "space-y-2",
          "sm": "space-y-4",
          "md": "space-y-6",
          "lg": "space-y-10"
        },
        "grid": {
          "cards": "grid gap-5 sm:gap-6 lg:gap-8",
          "stays": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          "experiences": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          "dashboard": "grid-cols-1 lg:grid-cols-[280px_1fr]"
        }
      },
      "radius": {
        "card": "rounded-2xl",
        "media": "rounded-3xl",
        "pill": "rounded-full",
        "input": "rounded-xl"
      },
      "shadow": {
        "soft": "shadow-[0_10px_30px_rgba(20,19,18,0.08)]",
        "lift": "shadow-[0_18px_50px_rgba(20,19,18,0.12)]",
        "inset": "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      }
    },

    "texture_and_motifs": {
      "principle": "Textures = subtilité premium. Jamais en arrière-plan de texte long.",
      "noise_overlay_css": "/* Add once in index.css */\n.noise-overlay{\n  position: relative;\n}\n.noise-overlay:before{\n  content:'';\n  pointer-events:none;\n  position:absolute;\n  inset:0;\n  background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.08%22/%3E%3C/svg%3E');\n  mix-blend-mode:multiply;\n  opacity:0.35;\n  border-radius: inherit;\n}",
      "motif_usage": {
        "where": [
          "Hero corners as faint mask",
          "Section dividers",
          "Empty states illustrations",
          "Admin dashboard header strip"
        ],
        "dont": [
          "Do not tile motifs behind paragraphs",
          "Do not use high-contrast patterns"
        ]
      }
    }
  },

  "component_system": {
    "component_path": {
      "shadcn_ui": "/app/frontend/src/components/ui",
      "primary_components": [
        "button.jsx",
        "card.jsx",
        "input.jsx",
        "select.jsx",
        "calendar.jsx",
        "popover.jsx",
        "dialog.jsx",
        "sheet.jsx",
        "tabs.jsx",
        "badge.jsx",
        "navigation-menu.jsx",
        "pagination.jsx",
        "skeleton.jsx",
        "sonner.jsx",
        "table.jsx",
        "dropdown-menu.jsx",
        "tooltip.jsx",
        "separator.jsx",
        "avatar.jsx",
        "checkbox.jsx",
        "slider.jsx"
      ]
    },

    "buttons": {
      "style": "Luxury / Elegant (rounded 10–14px, subtle elevation, gentle hover)",
      "variants": {
        "primary": {
          "description": "Terracotta fill, white text, soft shadow",
          "tailwind": "bg-[color:var(--primary)] text-white hover:brightness-[0.97] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2",
          "data_testid_examples": [
            "hero-search-submit-button",
            "stay-card-book-button",
            "checkout-confirm-button"
          ]
        },
        "secondary": {
          "description": "Deep green fill, white text",
          "tailwind": "bg-[hsl(var(--secondary))] text-white hover:brightness-[1.03] active:scale-[0.98]",
          "data_testid_examples": [
            "experience-card-view-button",
            "admin-publish-button"
          ]
        },
        "ghost": {
          "description": "Transparent with sand border; premium feel",
          "tailwind": "bg-transparent border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
          "data_testid_examples": ["navbar-login-link", "filters-clear-button"]
        }
      },
      "sizes": {
        "sm": "h-9 px-3 text-sm rounded-xl",
        "md": "h-11 px-4 text-sm rounded-xl",
        "lg": "h-12 px-5 text-base rounded-2xl"
      },
      "micro_interactions": [
        "Hover: slight lift (translate-y-[-1px]) + shadow soft",
        "Active: scale 0.98",
        "Focus: visible ring (no outline removal)"
      ]
    },

    "cards": {
      "stay_card": {
        "base": "group rounded-2xl bg-white border border-[hsl(var(--border))] overflow-hidden",
        "hover": "hover:shadow-[0_18px_50px_rgba(20,19,18,0.12)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200",
        "image": "aspect-[4/3] w-full object-cover",
        "badge": "absolute left-3 top-3",
        "price": "font-semibold",
        "data_testid": {
          "card": "stay-card",
          "favorite": "stay-card-favorite-button",
          "open": "stay-card-open-link"
        }
      },
      "experience_card": {
        "base": "rounded-2xl bg-white border border-[hsl(var(--border))] overflow-hidden",
        "category_chip": "rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs",
        "data_testid": {
          "card": "experience-card",
          "open": "experience-card-open-link"
        }
      },
      "editorial_quote_card": {
        "base": "rounded-3xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] p-6 noise-overlay",
        "accent": "border-l-4 border-l-[hsl(var(--premium))]"
      }
    },

    "navigation": {
      "top_nav": {
        "layout": "Sticky, translucent (glass-lite) over hero; becomes solid on scroll",
        "tailwind": "sticky top-0 z-50 backdrop-blur-md bg-white/70 supports-[backdrop-filter]:bg-white/60 border-b border-[hsl(var(--border))]",
        "items": ["Hébergements", "Expériences", "Destinations", "À propos"],
        "right": ["Connexion", "Créer un compte", "Favoris"],
        "data_testid": {
          "nav": "top-navigation",
          "logo": "navbar-logo-link",
          "login": "navbar-login-link",
          "register": "navbar-register-link"
        }
      },
      "mobile": {
        "component": "sheet.jsx",
        "pattern": "Hamburger opens Sheet with large tap targets (min 44px height).",
        "data_testid": {
          "open": "mobile-nav-open-button",
          "close": "mobile-nav-close-button"
        }
      }
    },

    "hero_search": {
      "wow_pattern": {
        "structure": [
          "Full-bleed photo (parallax subtle)",
          "Overlay gradient (hero_overlay)",
          "Floating pill search bar (white card) anchored bottom of hero"
        ],
        "search_bar": {
          "component": "Use shadcn Input + Popover(Calendar) + Select",
          "layout_tailwind": "w-full max-w-4xl mx-auto rounded-full bg-white/95 backdrop-blur border border-[hsl(var(--border))] shadow-[0_18px_50px_rgba(20,19,18,0.14)]",
          "inner": "grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 p-2",
          "field": "rounded-full px-4 h-12",
          "cta": "rounded-full h-12 px-5",
          "data_testid": {
            "form": "hero-search-form",
            "destination": "hero-search-destination-input",
            "dates": "hero-search-dates-button",
            "guests": "hero-search-guests-select",
            "submit": "hero-search-submit-button"
          }
        },
        "micro_interactions": [
          "Parallax background: translateY 12–18px max on scroll",
          "Search pill: slight scale-in on mount (Framer Motion)",
          "Inputs: focus ring terracotta"
        ]
      }
    },

    "filters": {
      "pattern": "Desktop: left filter rail in Sheet/Drawer; Mobile: bottom Drawer with sticky apply button.",
      "components": ["sheet.jsx", "slider.jsx", "checkbox.jsx", "select.jsx"],
      "filter_chips": {
        "tailwind": "inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1 text-sm hover:bg-[hsl(var(--muted))] transition-[background-color]",
        "data_testid": "active-filter-chip"
      },
      "data_testid": {
        "open": "filters-open-button",
        "apply": "filters-apply-button",
        "clear": "filters-clear-button"
      }
    },

    "map_and_markers": {
      "library": "Leaflet + OpenStreetMap",
      "layout": {
        "desktop": "Split view: listings left (scroll) + map right (sticky)",
        "tailwind": "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6"
      },
      "marker_style": {
        "concept": "Price pill marker (white) with terracotta border + tiny gold dot for premium",
        "css": ".ts-marker{\n  background:#fff;\n  border:1px solid rgba(233,216,194,1);\n  border-radius:999px;\n  padding:6px 10px;\n  box-shadow:0 10px 30px rgba(20,19,18,.12);\n  font:600 12px var(--font-body);\n}\n.ts-marker--active{\n  border-color:#C86B4A;\n  box-shadow:0 18px 50px rgba(20,19,18,.18);\n}\n.ts-marker__dot{\n  display:inline-block;\n  width:6px;height:6px;border-radius:999px;\n  background:#D6B25E;\n  margin-right:6px;\n}",
        "data_testid": "leaflet-price-marker"
      }
    },

    "gallery": {
      "detail_gallery": {
        "pattern": "Immersive mosaic: 1 large + 4 small; opens Dialog full-screen carousel",
        "components": ["aspect-ratio.jsx", "dialog.jsx", "carousel.jsx"],
        "tailwind": {
          "grid": "grid grid-cols-2 md:grid-cols-4 gap-2",
          "hero": "col-span-2 md:col-span-2 row-span-2 rounded-3xl overflow-hidden",
          "thumb": "rounded-2xl overflow-hidden"
        },
        "data_testid": {
          "open": "stay-gallery-open-button",
          "carousel": "stay-gallery-carousel"
        }
      }
    },

    "forms_auth": {
      "components": ["form.jsx", "input.jsx", "label.jsx", "button.jsx", "sonner.jsx"],
      "pattern": "Auth pages are editorial: left image panel (hidden on mobile) + right form card.",
      "tailwind": {
        "layout": "min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2",
        "form_card": "max-w-md w-full mx-auto rounded-3xl bg-white border border-[hsl(var(--border))] p-6 sm:p-8 shadow-[0_18px_50px_rgba(20,19,18,0.10)]"
      },
      "data_testid": {
        "email": "auth-email-input",
        "password": "auth-password-input",
        "submit": "auth-submit-button",
        "google": "auth-google-button",
        "error": "auth-error-text"
      }
    },

    "date_picker": {
      "component": "calendar.jsx + popover.jsx",
      "rules": [
        "Always use shadcn Calendar (no native date input).",
        "Show range selection for stays.",
        "Disable past dates.",
        "Mobile: open in Drawer for thumb reach."
      ],
      "data_testid": {
        "open": "date-picker-open-button",
        "calendar": "date-picker-calendar"
      }
    },

    "tables_admin": {
      "components": ["table.jsx", "dropdown-menu.jsx", "badge.jsx", "tabs.jsx"],
      "pattern": "Admin uses dense but breathable tables with sticky header and row actions.",
      "tailwind": {
        "table_wrap": "rounded-2xl border border-[hsl(var(--border))] bg-white overflow-hidden",
        "thead": "bg-[hsl(var(--muted))]",
        "row_hover": "hover:bg-[hsl(var(--muted))]/60 transition-[background-color]"
      },
      "data_testid": {
        "users_table": "admin-users-table",
        "stays_table": "admin-stays-table",
        "experiences_table": "admin-experiences-table",
        "reservations_table": "admin-reservations-table"
      }
    },

    "toasts": {
      "library": "sonner",
      "component": "/app/frontend/src/components/ui/sonner.jsx",
      "usage": "Use for booking confirmation, auth errors, admin publish success.",
      "data_testid": "toast-message"
    }
  },

  "page_blueprints": {
    "homepage": {
      "sections": [
        "Hero photo + floating search pill",
        "Destinations vedettes (bento grid)",
        "Hébergements premium (carousel on mobile)",
        "Expériences par catégorie (chips + grid)",
        "Editorial strip: 'Teranga' meaning + quote card",
        "Témoignages",
        "Footer"
      ],
      "destinations_bento": {
        "tailwind": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        "tile": "rounded-3xl overflow-hidden relative min-h-[180px]",
        "overlay": "absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
      }
    },
    "stays_list": {
      "layout": "Desktop split list/map; mobile list-first with map toggle.",
      "map_toggle": "Use Tabs: 'Liste' / 'Carte'",
      "data_testid": {
        "map_tab": "stays-map-tab",
        "list_tab": "stays-list-tab"
      }
    },
    "stay_detail": {
      "sections": [
        "Gallery mosaic",
        "Key facts row (beds, baths, wifi) as icon chips",
        "Description + amenities",
        "Map snippet",
        "Booking card (sticky on desktop)",
        "Reviews"
      ],
      "booking_card": {
        "tailwind": "rounded-3xl border border-[hsl(var(--border))] bg-white p-5 shadow-[0_18px_50px_rgba(20,19,18,0.10)] lg:sticky lg:top-24",
        "data_testid": {
          "card": "booking-card",
          "reserve": "booking-reserve-button"
        }
      }
    },
    "admin_dashboard": {
      "layout": "Left sidebar + content; top KPI cards; charts.",
      "charts": {
        "library": "recharts",
        "install": "npm i recharts",
        "usage": "Bookings over time, revenue simulated, top destinations.",
        "empty_state": "Show Skeleton + 'Pas encore de données'"
      }
    }
  },

  "motion_and_microinteractions": {
    "library": {
      "framer_motion": {
        "install": "npm i framer-motion",
        "use_cases": [
          "Hero search pill entrance",
          "Card hover lift",
          "Page section reveal",
          "Map/list toggle transitions"
        ]
      }
    },
    "principles": [
      "No universal transition: use transition-[background-color,box-shadow,opacity]",
      "Durations: 160–220ms for hover; 280–420ms for entrances",
      "Easing: ease-out for entrances; ease-in-out for toggles",
      "Respect prefers-reduced-motion"
    ],
    "snippets": {
      "reveal": "<motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:'-80px'}} transition={{duration:0.35, ease:'easeOut'}} />",
      "parallax_scroll": "// on scroll: set CSS var --hero-parallax = Math.min(18, window.scrollY * 0.06)\n// apply: transform: translate3d(0, calc(var(--hero-parallax) * 1px), 0)"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast (text on sand backgrounds must be charcoal/ink)",
      "Focus visible ring on all interactive elements",
      "Tap targets >= 44px",
      "Form errors: text + aria-describedby",
      "Images: meaningful alt text in French"
    ],
    "keyboard": [
      "Navigation menu fully keyboard accessible",
      "Dialog/Sheet trap focus (shadcn handles)"
    ]
  },

  "seo_and_content": {
    "rules": [
      "Use semantic headings (one H1 per page)",
      "Destination pages: unique meta title/description",
      "Use descriptive URLs: /destinations/casamance",
      "Lazy-load below-the-fold images"
    ]
  },

  "image_urls": {
    "hero_and_sections": [
      {
        "category": "hero",
        "description": "Aerial tropical coastline (hero background).",
        "url": "https://images.unsplash.com/photo-1716997338016-93b456b3ea8f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0JTIwYWVyaWFsfGVufDB8fHx0ZWFsfDE3Nzg0NTU2ODJ8MA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "hero",
        "description": "Aerial beach + city edge (secondary hero / destination header).",
        "url": "https://images.unsplash.com/photo-1711922729222-54107d20c970?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHx0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0JTIwYWVyaWFsfGVufDB8fHx0ZWFsfDE3Nzg0NTU2ODJ8MA&ixlib=rb-4.1.0&q=85"
      }
    ],
    "textures_and_motifs": [
      {
        "category": "motif",
        "description": "African textile pattern reference (use as subtle masked accent, not tiled behind text).",
        "url": "https://images.unsplash.com/photo-1595948090673-dc6a9ffd1f16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwdGV4dGlsZSUyMHBhdHRlcm4lMjBib2dvbGFuJTIwd2F4JTIwZmFicmljJTIwdGV4dHVyZXxlbnwwfHx8eWVsbG93fDE3Nzg0NTU2NzR8MA&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "texture",
        "description": "Terracotta wall texture reference for warm section backgrounds (very low opacity).",
        "url": "https://images.unsplash.com/photo-1619891059344-ee1c029b6347?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHx0ZXJyYWNvdHRhJTIwY2xheSUyMHdhbGwlMjB0ZXh0dXJlJTIwd2FybXxlbnwwfHx8b3JhbmdlfDE3Nzg0NTU2ODZ8MA&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "do_and_dont": {
    "do": [
      "Do keep content areas solid (white/sand) for readability",
      "Do use large photography with rounded corners (rounded-3xl)",
      "Do use subtle noise overlay on big surfaces only",
      "Do show total price clearly (éviter surprises)",
      "Do keep gold accents minimal (premium highlight)",
      "Do add data-testid to every interactive element and key info"
    ],
    "dont": [
      "Don’t clone Airbnb: avoid identical spacing/typography; keep editorial African twist",
      "Don’t use purple anywhere (especially gradients)",
      "Don’t use gradients on cards or text-heavy sections",
      "Don’t use transition: all",
      "Don’t center-align the whole app container",
      "Don’t use emoji icons; use lucide-react or FontAwesome"
    ]
  },

  "instructions_to_main_agent": {
    "global_css_updates": [
      "Remove CRA default App.css centering header styles; keep App.css minimal or delete unused classes.",
      "In index.css: import Google Fonts, set CSS vars for fonts, replace shadcn HSL tokens with the semantic tokens above (map --background etc to --bg/--fg values).",
      "Add .noise-overlay utility and optional .hero-parallax class."
    ],
    "tailwind_usage": [
      "Prefer token-driven colors via hsl(var(--...)) in Tailwind arbitrary values.",
      "Use container + section_padding utilities consistently.",
      "Ensure all Buttons/Inputs/Links include data-testid in kebab-case."
    ],
    "libraries": [
      {
        "name": "framer-motion",
        "why": "Hero WOW + subtle reveals",
        "install": "npm i framer-motion"
      },
      {
        "name": "recharts",
        "why": "Admin analytics charts",
        "install": "npm i recharts"
      },
      {
        "name": "leaflet + react-leaflet",
        "why": "Map interactive listings",
        "install": "npm i leaflet react-leaflet"
      }
    ],
    "testing": {
      "rule": "All interactive and key informational elements MUST include data-testid.",
      "convention": "kebab-case describing role (e.g., 'filters-apply-button')."
    }
  },

  "appendix_general_ui_ux_design_guidelines": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
