export const translations = {
  en: {
    ui: {
      title: 'Flowcy',
      subtitle: 'Customer flow analysis workspace. Select personas and layers to explore accessibility and competition.',
      personas: 'Personas',
      layers: 'Layers',
      settings: 'Settings',
      language: 'Language',
      yes: 'Yes',
      no: 'No',
    },
    layers: {
      bikeshare: { label: 'Bike share stations' },
      annecySibraRoutes: { label: 'SIBRA routes (live API)' },
      annecySibraStops: { label: 'SIBRA stops (live API)' },
      annecyTerritory: { label: 'Annecy territory outline (API)' },
      annecySibraVehicles: { label: 'SIBRA vehicles (realtime)' },
    },
    layerTypes: {
      bikeshare: 'Bikeshare',
      annecySibraRoutes: 'Transit',
      annecySibraStops: 'Stops',
      annecyTerritory: 'Boundary',
      annecySibraVehicles: 'Realtime',
    },
    personas: {
      'after-school-teens': {
        label: 'After-school teens',
        summary: 'Short trips after school, low willingness to walk uphill.'
      },
      'students-multi': {
        label: 'Multi-activity students',
        summary: 'Flexible schedules, accept longer trips for diverse venues.'
      },
      'family-weekend': {
        label: 'Weekend families',
        summary: 'Prefer parking and multi-stop itineraries.'
      },
    },
    modes: {
      walk: 'Walk',
      bike: 'Bike',
      bus: 'Bus',
      car: 'Car',
    },
    map: {
      lineLabel: 'Line',
      stationLabel: 'Station',
      bikesAvailableLabel: 'Bikes available',
      docksAvailableLabel: 'Docks available',
      stopLabel: 'Stop',
      directionLabel: 'Direction',
      accessibilityLabel: 'Accessible',
      terminusLabel: 'Terminus',
      vehicleLabel: 'Vehicle',
      statusLabel: 'Status',
      occupancyLabel: 'Occupancy',
    },
  },
  fr: {
    ui: {
      title: 'Flowcy',
      subtitle: "Espace d'analyse des flux clients. Selectionne des personas et des couches pour explorer l'accessibilite et la concurrence.",
      personas: 'Personas',
      layers: 'Couches',
      settings: 'Parametres',
      language: 'Langue',
      yes: 'Oui',
      no: 'Non',
    },
    layers: {
      bikeshare: { label: 'Stations velos' },
      annecySibraRoutes: { label: 'Lignes SIBRA (API live)' },
      annecySibraStops: { label: 'Arrets SIBRA (API live)' },
      annecyTerritory: { label: 'Perimetre Annecy (API)' },
      annecySibraVehicles: { label: 'Bus SIBRA (temps reel)' },
    },
    layerTypes: {
      bikeshare: 'Velos',
      annecySibraRoutes: 'Transport',
      annecySibraStops: 'Arrets',
      annecyTerritory: 'Zone',
      annecySibraVehicles: 'Temps reel',
    },
    personas: {
      'after-school-teens': {
        label: 'Ados apres les cours',
        summary: 'Trajets courts apres l ecole, faible tolerance aux pentes.'
      },
      'students-multi': {
        label: 'Etudiants multi-activites',
        summary: 'Horaires flexibles, acceptent des trajets plus longs.'
      },
      'family-weekend': {
        label: 'Familles du week-end',
        summary: 'Priorite au parking et aux trajets multi-etapes.'
      },
    },
    modes: {
      walk: 'Marche',
      bike: 'Velo',
      bus: 'Bus',
      car: 'Voiture',
    },
    map: {
      lineLabel: 'Ligne',
      stationLabel: 'Station',
      bikesAvailableLabel: 'Velos disponibles',
      docksAvailableLabel: 'Places libres',
      stopLabel: 'Arret',
      directionLabel: 'Direction',
      accessibilityLabel: 'Accessible',
      terminusLabel: 'Terminus',
      vehicleLabel: 'Vehicule',
      statusLabel: 'Statut',
      occupancyLabel: 'Charge',
    },
  },
} as const;

export type SupportedLanguage = keyof typeof translations;
