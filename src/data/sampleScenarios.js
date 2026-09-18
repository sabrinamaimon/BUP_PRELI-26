/**
 * GridWise Canonical & Realistic Synthetic 24-Hour Campus Scenarios
 */

export const sampleScenarios = [
  {
    id: "GRID-101",
    name: "Canonical Scenario 101 (Panel Cleaning & Charge Lockout)",
    description: "Standard campus operational day with solar panel wash in the early afternoon and midday battery charge lockout.",
    scenario_id: "GRID-101",
    operator_notes: [
      "Solar output will drop to about 20% from 1 PM to 3 PM.",
      "Do not charge the battery between 2 PM and 4 PM.",
      "The cafeteria menu changes tomorrow."
    ],
    battery: {
      capacity_kwh: 500,
      initial_energy_kwh: 200,
      minimum_energy_kwh: 50,
      max_charge_kwh_per_hour: 100,
      max_discharge_kwh_per_hour: 100
    },
    hours: [
      { hour: 0, demand_kwh: 180, solar_kwh: 0, tariff_bdt_per_kwh: 7.0 },
      { hour: 1, demand_kwh: 160, solar_kwh: 0, tariff_bdt_per_kwh: 7.0 },
      { hour: 2, demand_kwh: 150, solar_kwh: 0, tariff_bdt_per_kwh: 7.0 },
      { hour: 3, demand_kwh: 140, solar_kwh: 0, tariff_bdt_per_kwh: 6.5 },
      { hour: 4, demand_kwh: 145, solar_kwh: 0, tariff_bdt_per_kwh: 6.5 },
      { hour: 5, demand_kwh: 160, solar_kwh: 5, tariff_bdt_per_kwh: 6.5 },
      { hour: 6, demand_kwh: 190, solar_kwh: 35, tariff_bdt_per_kwh: 7.5 },
      { hour: 7, demand_kwh: 240, solar_kwh: 90, tariff_bdt_per_kwh: 8.0 },
      { hour: 8, demand_kwh: 310, solar_kwh: 160, tariff_bdt_per_kwh: 9.5 },
      { hour: 9, demand_kwh: 380, solar_kwh: 230, tariff_bdt_per_kwh: 10.0 },
      { hour: 10, demand_kwh: 410, solar_kwh: 280, tariff_bdt_per_kwh: 10.5 },
      { hour: 11, demand_kwh: 430, solar_kwh: 300, tariff_bdt_per_kwh: 10.5 },
      { hour: 12, demand_kwh: 420, solar_kwh: 310, tariff_bdt_per_kwh: 10.5 },
      { hour: 13, demand_kwh: 400, solar_kwh: 290, tariff_bdt_per_kwh: 10.5 },
      { hour: 14, demand_kwh: 390, solar_kwh: 250, tariff_bdt_per_kwh: 10.5 },
      { hour: 15, demand_kwh: 360, solar_kwh: 180, tariff_bdt_per_kwh: 10.0 },
      { hour: 16, demand_kwh: 320, solar_kwh: 110, tariff_bdt_per_kwh: 9.5 },
      { hour: 17, demand_kwh: 300, solar_kwh: 40, tariff_bdt_per_kwh: 11.0 },
      { hour: 18, demand_kwh: 350, solar_kwh: 0, tariff_bdt_per_kwh: 12.5 },
      { hour: 19, demand_kwh: 380, solar_kwh: 0, tariff_bdt_per_kwh: 12.5 },
      { hour: 20, demand_kwh: 340, solar_kwh: 0, tariff_bdt_per_kwh: 11.5 },
      { hour: 21, demand_kwh: 280, solar_kwh: 0, tariff_bdt_per_kwh: 9.5 },
      { hour: 22, demand_kwh: 240, solar_kwh: 0, tariff_bdt_per_kwh: 8.5 },
      { hour: 23, demand_kwh: 200, solar_kwh: 0, tariff_bdt_per_kwh: 7.5 }
    ]
  },
  {
    id: "GRID-202",
    name: "Storm Cloud Advisory & Emergency Evening Reserve",
    description: "Cloud cover causes steep solar curtailment midday, with heightened battery reserve mandated for evening lab sessions.",
    scenario_id: "GRID-202",
    operator_notes: [
      "Expect an 80% reduction in rooftop solar during the 1-3 PM maintenance window.",
      "Keep at least 150 kWh in reserve from 6 PM until 9 PM.",
      "The campus badminton tournament starts next weekend."
    ],
    battery: {
      capacity_kwh: 600,
      initial_energy_kwh: 250,
      minimum_energy_kwh: 60,
      max_charge_kwh_per_hour: 120,
      max_discharge_kwh_per_hour: 120
    },
    hours: [
      { hour: 0, demand_kwh: 200, solar_kwh: 0, tariff_bdt_per_kwh: 6.8 },
      { hour: 1, demand_kwh: 180, solar_kwh: 0, tariff_bdt_per_kwh: 6.8 },
      { hour: 2, demand_kwh: 170, solar_kwh: 0, tariff_bdt_per_kwh: 6.8 },
      { hour: 3, demand_kwh: 160, solar_kwh: 0, tariff_bdt_per_kwh: 6.0 },
      { hour: 4, demand_kwh: 165, solar_kwh: 0, tariff_bdt_per_kwh: 6.0 },
      { hour: 5, demand_kwh: 180, solar_kwh: 10, tariff_bdt_per_kwh: 6.5 },
      { hour: 6, demand_kwh: 210, solar_kwh: 40, tariff_bdt_per_kwh: 7.5 },
      { hour: 7, demand_kwh: 260, solar_kwh: 110, tariff_bdt_per_kwh: 8.5 },
      { hour: 8, demand_kwh: 340, solar_kwh: 200, tariff_bdt_per_kwh: 9.8 },
      { hour: 9, demand_kwh: 420, solar_kwh: 280, tariff_bdt_per_kwh: 10.5 },
      { hour: 10, demand_kwh: 460, solar_kwh: 340, tariff_bdt_per_kwh: 11.0 },
      { hour: 11, demand_kwh: 480, solar_kwh: 360, tariff_bdt_per_kwh: 11.0 },
      { hour: 12, demand_kwh: 470, solar_kwh: 380, tariff_bdt_per_kwh: 11.0 },
      { hour: 13, demand_kwh: 450, solar_kwh: 350, tariff_bdt_per_kwh: 11.0 },
      { hour: 14, demand_kwh: 430, solar_kwh: 310, tariff_bdt_per_kwh: 11.0 },
      { hour: 15, demand_kwh: 390, solar_kwh: 220, tariff_bdt_per_kwh: 10.5 },
      { hour: 16, demand_kwh: 350, solar_kwh: 130, tariff_bdt_per_kwh: 10.0 },
      { hour: 17, demand_kwh: 320, solar_kwh: 50, tariff_bdt_per_kwh: 11.5 },
      { hour: 18, demand_kwh: 390, solar_kwh: 0, tariff_bdt_per_kwh: 13.0 },
      { hour: 19, demand_kwh: 420, solar_kwh: 0, tariff_bdt_per_kwh: 13.0 },
      { hour: 20, demand_kwh: 380, solar_kwh: 0, tariff_bdt_per_kwh: 12.0 },
      { hour: 21, demand_kwh: 310, solar_kwh: 0, tariff_bdt_per_kwh: 10.0 },
      { hour: 22, demand_kwh: 270, solar_kwh: 0, tariff_bdt_per_kwh: 9.0 },
      { hour: 23, demand_kwh: 220, solar_kwh: 0, tariff_bdt_per_kwh: 7.5 }
    ]
  },
  {
    id: "GRID-303",
    name: "Grid Peak Shaving & Discharge Lockout",
    description: "Severe grid tariff spikes in the late afternoon requiring a strict grid import ceiling and morning discharge embargo.",
    scenario_id: "GRID-303",
    operator_notes: [
      "Do not discharge the battery between 8 AM and 11 AM.",
      "Grid import may not exceed 220 kWh between 6 PM and 9 PM.",
      "The academic calendar update was emailed today."
    ],
    battery: {
      capacity_kwh: 550,
      initial_energy_kwh: 220,
      minimum_energy_kwh: 50,
      max_charge_kwh_per_hour: 110,
      max_discharge_kwh_per_hour: 110
    },
    hours: [
      { hour: 0, demand_kwh: 190, solar_kwh: 0, tariff_bdt_per_kwh: 7.2 },
      { hour: 1, demand_kwh: 170, solar_kwh: 0, tariff_bdt_per_kwh: 7.2 },
      { hour: 2, demand_kwh: 155, solar_kwh: 0, tariff_bdt_per_kwh: 7.2 },
      { hour: 3, demand_kwh: 145, solar_kwh: 0, tariff_bdt_per_kwh: 6.2 },
      { hour: 4, demand_kwh: 150, solar_kwh: 0, tariff_bdt_per_kwh: 6.2 },
      { hour: 5, demand_kwh: 170, solar_kwh: 8, tariff_bdt_per_kwh: 6.8 },
      { hour: 6, demand_kwh: 200, solar_kwh: 35, tariff_bdt_per_kwh: 7.8 },
      { hour: 7, demand_kwh: 250, solar_kwh: 95, tariff_bdt_per_kwh: 8.5 },
      { hour: 8, demand_kwh: 320, solar_kwh: 170, tariff_bdt_per_kwh: 10.0 },
      { hour: 9, demand_kwh: 390, solar_kwh: 240, tariff_bdt_per_kwh: 10.5 },
      { hour: 10, demand_kwh: 430, solar_kwh: 290, tariff_bdt_per_kwh: 11.0 },
      { hour: 11, demand_kwh: 440, solar_kwh: 310, tariff_bdt_per_kwh: 11.0 },
      { hour: 12, demand_kwh: 430, solar_kwh: 320, tariff_bdt_per_kwh: 11.0 },
      { hour: 13, demand_kwh: 410, solar_kwh: 300, tariff_bdt_per_kwh: 11.0 },
      { hour: 14, demand_kwh: 395, solar_kwh: 260, tariff_bdt_per_kwh: 11.0 },
      { hour: 15, demand_kwh: 370, solar_kwh: 190, tariff_bdt_per_kwh: 10.5 },
      { hour: 16, demand_kwh: 330, solar_kwh: 120, tariff_bdt_per_kwh: 10.0 },
      { hour: 17, demand_kwh: 310, solar_kwh: 45, tariff_bdt_per_kwh: 11.8 },
      { hour: 18, demand_kwh: 370, solar_kwh: 0, tariff_bdt_per_kwh: 13.5 },
      { hour: 19, demand_kwh: 400, solar_kwh: 0, tariff_bdt_per_kwh: 13.5 },
      { hour: 20, demand_kwh: 360, solar_kwh: 0, tariff_bdt_per_kwh: 12.5 },
      { hour: 21, demand_kwh: 290, solar_kwh: 0, tariff_bdt_per_kwh: 10.2 },
      { hour: 22, demand_kwh: 250, solar_kwh: 0, tariff_bdt_per_kwh: 8.8 },
      { hour: 23, demand_kwh: 210, solar_kwh: 0, tariff_bdt_per_kwh: 7.8 }
    ]
  }
];
