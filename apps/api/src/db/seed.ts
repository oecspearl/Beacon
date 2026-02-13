import "dotenv/config";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import {
  countries,
  emergencyProtocols,
  coordinators,
  students,
  emergencyContacts,
} from "./schema.js";

// ---------------------------------------------------------------------------
// Database connection (standalone — avoids importing the full app config)
// ---------------------------------------------------------------------------

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// ---------------------------------------------------------------------------
// Password hashing helper (scrypt, same approach as coordinators route)
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function seed() {
  console.log("🌱 Seeding Beacon database …\n");

  // ── Truncate tables in dependency order ──────────────────────────────
  console.log("  Truncating existing data …");
  await db.execute(
    sql`TRUNCATE
      emergency_contacts,
      student_locations,
      student_statuses,
      checkins,
      panic_events,
      escalation_events,
      remote_wipe_commands,
      group_members,
      groups,
      messages,
      broadcast_messages,
      audit_log,
      students,
      emergency_protocols,
      coordinators,
      countries
    CASCADE`,
  );

  // =====================================================================
  // 1. COUNTRIES
  // =====================================================================

  console.log("  Inserting countries …");

  await db.insert(countries).values([
    {
      code: "CU",
      name: "Cuba",
      emergencyNumbers: {
        police: "106",
        ambulance: "104",
        fire: "105",
        general: null,
      },
      mapBounds: {
        north: 23.28,
        south: 19.82,
        east: -74.13,
        west: -84.95,
      },
    },
    {
      code: "JM",
      name: "Jamaica",
      emergencyNumbers: {
        police: "119",
        ambulance: "110",
        fire: "110",
        general: null,
      },
      mapBounds: {
        north: 18.53,
        south: 17.7,
        east: -76.18,
        west: -78.37,
      },
    },
    {
      code: "TT",
      name: "Trinidad and Tobago",
      emergencyNumbers: {
        police: "999",
        ambulance: "990",
        fire: "990",
        general: "800-TIPS (800-8477)",
      },
      mapBounds: {
        north: 11.36,
        south: 10.04,
        east: -60.52,
        west: -61.93,
      },
    },
  ]);

  // =====================================================================
  // 2. EMERGENCY PROTOCOLS
  // =====================================================================

  console.log("  Inserting emergency protocols …");

  // ── Cuba Protocol ────────────────────────────────────────────────────
  await db.insert(emergencyProtocols).values({
    countryCode: "CU",
    version: 1,
    content: {
      sections: [
        {
          id: "cu-overview",
          title: "General Emergency Overview — Cuba",
          type: "info",
          content: {
            summary:
              "Cuba has a centralised emergency response system. Foreign nationals should be aware that internet access is limited and mobile connectivity may be unreliable outside Havana. Always carry a physical copy of your passport and student visa. The OECS Beacon system provides an offline-capable panic button that works via SMS fallback when data is unavailable.",
            keyFacts: [
              "Police: 106 | Ambulance: 104 | Fire: 105",
              "Cuba uses a single-payer healthcare system — foreign students are typically directed to international clinics (Clínica Central Cira García in Havana).",
              "Currency: Cuban Peso (CUP). USD is NOT accepted at most establishments.",
              "Internet access is primarily through ETECSA Wi-Fi hotspots. Data SIMs have limited coverage outside urban centres.",
              "The U.S. embargo complicates some banking and communications — plan accordingly.",
            ],
          },
        },
        {
          id: "cu-decision-tree",
          title: "Immediate Danger Decision Tree",
          type: "decision_tree",
          content: {
            root: {
              question: "Are you in immediate physical danger?",
              yes: {
                action: "Activate the Beacon panic button immediately.",
                next: {
                  question:
                    "Can you safely move to a public or well-lit area?",
                  yes: {
                    action:
                      "Move to the nearest hotel lobby, police station, or hospital. Keep your phone visible and Beacon active.",
                  },
                  no: {
                    action:
                      "Stay where you are, lock doors if possible, and remain on the line with your emergency contact. Beacon will transmit your GPS coordinates to the OECS coordination centre.",
                  },
                },
              },
              no: {
                question: "Do you need medical attention?",
                yes: {
                  action:
                    "Call 104 for an ambulance or go directly to the nearest international clinic. Clínica Central Cira García (Havana): +53 7 204 2811.",
                },
                no: {
                  question: "Do you need to report a crime or incident?",
                  yes: {
                    action:
                      "Call 106 for police. File a report and request a copy (denuncia). Notify your OECS coordinator via the Beacon app.",
                  },
                  no: {
                    action:
                      "Use the Beacon check-in feature to confirm your status. Contact your group leader if you have non-urgent concerns.",
                  },
                },
              },
            },
          },
        },
        {
          id: "cu-contacts",
          title: "Embassy and Consulate Contacts",
          type: "contact_list",
          content: {
            description:
              "CARICOM and OECS diplomatic representations in Cuba. These offices can provide consular assistance to OECS nationals.",
            contacts: [
              {
                name: "CARICOM Embassy — Havana",
                role: "Regional diplomatic mission for CARICOM nationals",
                address:
                  "Calle 18 No. 503 e/ 5ta y 7ma, Miramar, Playa, Havana",
                phone: "+53 7 212 5872",
                email: "embassy.havana@caricom.org",
                latitude: 23.1325,
                longitude: -82.3847,
                hours: "Mon–Fri 08:00–16:00",
              },
              {
                name: "Jamaica Embassy — Havana",
                role: "Jamaican diplomatic mission (assists OECS nationals by arrangement)",
                address:
                  "Calle 22 No. 506 e/ 5ta Avenida y 7ma, Miramar, Havana",
                phone: "+53 7 214 1469",
                email: "jamaica.embassy.havana@mfaft.gov.jm",
                latitude: 23.1318,
                longitude: -82.3901,
                hours: "Mon–Fri 09:00–15:00",
              },
              {
                name: "Trinidad and Tobago Embassy — Havana",
                role: "T&T diplomatic mission (assists OECS nationals by arrangement)",
                address: "Calle 36A No. 503 e/ 5ta y 7ma, Miramar, Havana",
                phone: "+53 7 214 0487",
                email: "ttembassyhavana@foreign.gov.tt",
                latitude: 23.1295,
                longitude: -82.3915,
                hours: "Mon–Fri 08:30–16:30",
              },
              {
                name: "Clínica Central Cira García (International Clinic)",
                role: "Primary medical facility for foreign nationals",
                address:
                  "Calle 20 No. 4101 esq. Avenida 41, Playa, Havana",
                phone: "+53 7 204 2811",
                email: "cirag@infomed.sld.cu",
                latitude: 23.1282,
                longitude: -82.4021,
                hours: "24/7 Emergency Services",
              },
            ],
          },
        },
        {
          id: "cu-checklist",
          title: "Pre-Departure Checklist for Cuba",
          type: "checklist",
          content: {
            description:
              "Complete these items before travelling to Cuba as an OECS scholarship student.",
            items: [
              {
                id: "cu-chk-1",
                label:
                  "Obtain and verify your Cuban student visa (D-2 category).",
                critical: true,
              },
              {
                id: "cu-chk-2",
                label:
                  "Register with the Beacon app and complete the emergency walkthrough.",
                critical: true,
              },
              {
                id: "cu-chk-3",
                label:
                  "Purchase travel health insurance covering Cuba (verify policy covers medical evacuation).",
                critical: true,
              },
              {
                id: "cu-chk-4",
                label:
                  "Download offline maps for Havana and your university area in the Beacon app.",
                critical: false,
              },
              {
                id: "cu-chk-5",
                label:
                  "Inform your OECS coordinator of your flight details and arrival date.",
                critical: true,
              },
              {
                id: "cu-chk-6",
                label:
                  "Carry a printed copy of your passport, visa, and insurance policy.",
                critical: true,
              },
              {
                id: "cu-chk-7",
                label:
                  "Save the CARICOM Embassy Havana number (+53 7 212 5872) in your phone contacts.",
                critical: false,
              },
              {
                id: "cu-chk-8",
                label:
                  "Bring an unlocked GSM phone compatible with ETECSA frequencies (900/1800 MHz).",
                critical: false,
              },
            ],
          },
        },
      ],
    },
  });

  // ── Jamaica Protocol ─────────────────────────────────────────────────
  await db.insert(emergencyProtocols).values({
    countryCode: "JM",
    version: 1,
    content: {
      sections: [
        {
          id: "jm-natural-disaster",
          title: "Natural Disaster Protocol — Jamaica",
          type: "info",
          content: {
            summary:
              "Jamaica is located in the Caribbean hurricane belt and is seismically active. The Atlantic hurricane season runs June 1 – November 30. The Office of Disaster Preparedness and Emergency Management (ODPEM) coordinates national responses. OECS students should register with Beacon and follow institutional shelter-in-place directives during weather events.",
            keyFacts: [
              "Hurricane season: June 1 – November 30. Monitor the Meteorological Service of Jamaica for advisories.",
              "Jamaica experienced significant seismic activity — earthquake preparedness is essential.",
              "The ODPEM activates the National Emergency Operations Centre (NEOC) during major events.",
              "University shelters are pre-designated at UTech Jamaica and UWI Mona — know your assigned shelter location.",
              "Beacon will push automated check-in requests when a weather warning is issued for Jamaica.",
              "Keep a 72-hour emergency kit: water (1 gallon/person/day), non-perishable food, flashlight, batteries, first-aid kit, copies of documents.",
            ],
          },
        },
        {
          id: "jm-civil-unrest",
          title: "Safety Decision Tree — Civil Unrest",
          type: "decision_tree",
          content: {
            root: {
              question:
                "Are you aware of protests, roadblocks, or civil disturbances in your area?",
              yes: {
                question: "Are you currently in the affected area?",
                yes: {
                  action:
                    "Do NOT attempt to pass through roadblocks. Move to the nearest safe indoor location (university campus, hotel, or embassy). Activate Beacon check-in to confirm your status.",
                  next: {
                    question: "Are you in immediate danger (gunfire, violence nearby)?",
                    yes: {
                      action:
                        "Activate the Beacon panic button. Stay low, move away from windows, and seek the most interior room. Call 119 (police) only if safe to do so.",
                    },
                    no: {
                      action:
                        "Shelter in place. Monitor local news (TVJ, CVM) and Beacon alerts. Do not post your location on social media. Wait for an all-clear from your coordinator.",
                    },
                  },
                },
                no: {
                  action:
                    "Avoid the affected area entirely. Check Beacon for zone alerts. Adjust travel plans and notify your group leader if your route is impacted.",
                },
              },
              no: {
                action:
                  "Continue normal activities. Stay aware of your surroundings and keep your Beacon app active for real-time alerts.",
              },
            },
          },
        },
        {
          id: "jm-medical-contacts",
          title: "Medical Emergency Contacts — Jamaica",
          type: "contact_list",
          content: {
            description:
              "Key medical facilities and OECS/CARICOM diplomatic contacts in Jamaica for emergency assistance.",
            contacts: [
              {
                name: "University Hospital of the West Indies (UHWI)",
                role: "Primary teaching hospital — nearest to UWI Mona campus",
                address: "Mona, Kingston 7, Jamaica",
                phone: "+1 876 927 1620",
                email: "info@uhwi.gov.jm",
                latitude: 18.0058,
                longitude: -76.7488,
                hours: "24/7 Accident & Emergency",
              },
              {
                name: "Kingston Public Hospital (KPH)",
                role: "Major public hospital with trauma centre",
                address: "North Street, Kingston, Jamaica",
                phone: "+1 876 922 0210",
                email: null,
                latitude: 17.9981,
                longitude: -76.7935,
                hours: "24/7 Accident & Emergency",
              },
              {
                name: "OECS Commission — Kingston Liaison Office",
                role: "OECS representation providing consular support for member-state nationals",
                address:
                  "3rd Floor, The Jamaica Pegasus Hotel, 81 Knutsford Blvd, Kingston 5",
                phone: "+1 876 920 4752",
                email: "kingston@oecs.org",
                latitude: 18.0102,
                longitude: -76.7867,
                hours: "Mon–Fri 09:00–17:00",
              },
              {
                name: "CARICOM Secretariat Liaison — Kingston",
                role: "CARICOM regional coordination point",
                address: "60 Knutsford Blvd, Kingston 5, Jamaica",
                phone: "+1 876 926 7690",
                email: "info@caricom.org",
                latitude: 18.0098,
                longitude: -76.7893,
                hours: "Mon–Fri 08:30–16:30",
              },
              {
                name: "Andrews Memorial Hospital",
                role: "Private hospital — nearest to UTech Jamaica campus",
                address: "27 Hope Road, Kingston 10, Jamaica",
                phone: "+1 876 926 7401",
                email: "info@andrewshospital.com",
                latitude: 18.0155,
                longitude: -76.7725,
                hours: "24/7 Emergency",
              },
            ],
          },
        },
        {
          id: "jm-evacuation-checklist",
          title: "Evacuation Checklist — Jamaica",
          type: "checklist",
          content: {
            description:
              "In the event of a mandatory evacuation (hurricane, earthquake, civil emergency), follow this checklist.",
            items: [
              {
                id: "jm-evac-1",
                label:
                  "Confirm receipt of the evacuation order via Beacon alert and acknowledge in the app.",
                critical: true,
              },
              {
                id: "jm-evac-2",
                label:
                  "Gather your emergency go-bag: passport, documents, 3-day water/food supply, medications, phone charger, cash (JMD and USD).",
                critical: true,
              },
              {
                id: "jm-evac-3",
                label:
                  "Proceed to your designated university assembly point. UWI Mona: Assembly Hall. UTech: Shared Facilities Building.",
                critical: true,
              },
              {
                id: "jm-evac-4",
                label:
                  "Use Beacon check-in to confirm your status and location at the assembly point.",
                critical: true,
              },
              {
                id: "jm-evac-5",
                label:
                  "Do NOT attempt independent travel to the airport. Wait for coordinated OECS transport.",
                critical: true,
              },
              {
                id: "jm-evac-6",
                label:
                  "Contact your home-country emergency contact and provide your status.",
                critical: false,
              },
              {
                id: "jm-evac-7",
                label:
                  "If separated from your group, proceed to the OECS Kingston Liaison Office at the Jamaica Pegasus Hotel.",
                critical: false,
              },
              {
                id: "jm-evac-8",
                label:
                  "Maintain Beacon app connectivity. If data is unavailable, switch to SMS mode in app settings.",
                critical: true,
              },
            ],
          },
        },
      ],
    },
  });

  // ── Trinidad and Tobago Protocol ─────────────────────────────────────
  await db.insert(emergencyProtocols).values({
    countryCode: "TT",
    version: 1,
    content: {
      sections: [
        {
          id: "tt-overview",
          title: "General Safety Overview — Trinidad and Tobago",
          type: "info",
          content: {
            summary:
              "Trinidad and Tobago is a twin-island republic with distinct safety profiles. Trinidad (particularly Port of Spain and its environs) has higher urban crime rates, while Tobago is generally safer. OECS students should exercise heightened awareness, especially after dark in east Port of Spain, Laventille, Morvant, and Sea Lots. UWI St. Augustine is in a relatively safe area but standard precautions apply.",
            keyFacts: [
              "Police: 999 | Ambulance: 990 | Fire: 990 | Crime Stoppers: 800-TIPS (800-8477)",
              "The Trinidad and Tobago Police Service (TTPS) operates area divisions — St. Joseph Division covers UWI St. Augustine.",
              "Healthcare: Public hospitals are free but often crowded. Private facilities provide faster service.",
              "Currency: Trinidad and Tobago Dollar (TTD). USD is widely accepted but at variable rates.",
              "Carnival season (February–March) sees increased petty crime — heightened vigilance required.",
              "Avoid displaying expensive electronics or jewellery in public. Travel in groups after dark.",
            ],
          },
        },
        {
          id: "tt-crime-decision-tree",
          title: "Crime and Security Decision Tree",
          type: "decision_tree",
          content: {
            root: {
              question: "Are you a victim of or witness to a crime?",
              yes: {
                question: "Is the crime in progress or are you in danger?",
                yes: {
                  action:
                    "Call 999 immediately. Activate the Beacon panic button. Do NOT confront the perpetrator. Move to safety if you can do so without risk.",
                  next: {
                    question: "Have you been physically injured?",
                    yes: {
                      action:
                        "Call 990 for an ambulance. If possible, go to Eric Williams Medical Sciences Complex (Mt. Hope) or Port of Spain General Hospital. The Beacon app will transmit your location to the OECS coordination centre.",
                    },
                    no: {
                      action:
                        "Proceed to the nearest police station to file a report. St. Joseph Police Station (covers UWI): +1 868 662 2554. Request a copy of the report for insurance and consular purposes.",
                    },
                  },
                },
                no: {
                  action:
                    "Report the crime to police (999) as soon as possible. File a report at the nearest police station. Notify your OECS coordinator through the Beacon app. If property was stolen, also report to Crime Stoppers at 800-TIPS.",
                },
              },
              no: {
                question:
                  "Do you feel unsafe or have you noticed suspicious activity?",
                yes: {
                  action:
                    "Move to a well-lit, populated area. Use Beacon to check in with your coordinator and share your location. Avoid walking alone. If on campus, contact UWI Security: +1 868 662 2002 ext. 83086.",
                },
                no: {
                  action:
                    "Continue with standard safety precautions. Keep your Beacon app active and maintain regular check-ins with your group.",
                },
              },
            },
          },
        },
        {
          id: "tt-medical-contacts",
          title: "Medical Facilities and Emergency Contacts",
          type: "contact_list",
          content: {
            description:
              "Key medical facilities, OECS/CARICOM offices, and emergency contacts in Trinidad and Tobago.",
            contacts: [
              {
                name: "Eric Williams Medical Sciences Complex (EWMSC)",
                role: "Major public teaching hospital — nearest to UWI St. Augustine",
                address: "Uriah Butler Highway, Champs Fleurs, Trinidad",
                phone: "+1 868 645 4673",
                email: "info@ncrha.co.tt",
                latitude: 10.6389,
                longitude: -61.4079,
                hours: "24/7 Accident & Emergency",
              },
              {
                name: "Port of Spain General Hospital",
                role: "Main public hospital in the capital",
                address:
                  "169 Charlotte Street, Port of Spain, Trinidad",
                phone: "+1 868 623 2951",
                email: null,
                latitude: 10.6575,
                longitude: -61.5125,
                hours: "24/7 Accident & Emergency",
              },
              {
                name: "OECS Commission — Port of Spain Office",
                role: "OECS diplomatic and coordination office for member-state nationals",
                address:
                  "Level 7, ANSA Centre, 11c Maraval Road, Port of Spain",
                phone: "+1 868 622 4995",
                email: "portofspain@oecs.org",
                latitude: 10.6612,
                longitude: -61.5151,
                hours: "Mon–Fri 08:00–16:00",
              },
              {
                name: "CARICOM Secretariat — Trinidad Liaison",
                role: "Regional CARICOM coordination point",
                address:
                  "3rd Floor, Mutual Building, 16 Queen's Park West, Port of Spain",
                phone: "+1 868 623 0628",
                email: "trinidadliaison@caricom.org",
                latitude: 10.6625,
                longitude: -61.5185,
                hours: "Mon–Fri 09:00–16:30",
              },
              {
                name: "St. Joseph Police Station",
                role: "Police station covering UWI St. Augustine campus area",
                address: "Abercromby Street, St. Joseph, Trinidad",
                phone: "+1 868 662 2554",
                email: null,
                latitude: 10.6437,
                longitude: -61.4182,
                hours: "24/7",
              },
              {
                name: "UWI Health Services — St. Augustine",
                role: "Campus health centre for registered students",
                address:
                  "UWI St. Augustine Campus, St. Augustine, Trinidad",
                phone: "+1 868 663 1334",
                email: "health.services@sta.uwi.edu",
                latitude: 10.6405,
                longitude: -61.3998,
                hours: "Mon–Fri 08:00–18:00; Sat 09:00–13:00",
              },
            ],
          },
        },
        {
          id: "tt-comms-checklist",
          title: "Emergency Communications Checklist",
          type: "checklist",
          content: {
            description:
              "Ensure your emergency communications are set up and tested before you need them.",
            items: [
              {
                id: "tt-comm-1",
                label:
                  "Install the Beacon app and complete the emergency walkthrough, including granting location permissions.",
                critical: true,
              },
              {
                id: "tt-comm-2",
                label:
                  "Configure SMS fallback in Beacon settings (Settings > Communication > Enable SMS Fallback).",
                critical: true,
              },
              {
                id: "tt-comm-3",
                label:
                  "Save emergency numbers in your phone: Police 999, Ambulance 990, Fire 990, Crime Stoppers 800-8477.",
                critical: true,
              },
              {
                id: "tt-comm-4",
                label:
                  "Add your OECS coordinator as a Beacon emergency contact.",
                critical: true,
              },
              {
                id: "tt-comm-5",
                label:
                  "Test the Beacon panic button in safe mode (Settings > Test Panic Button) to verify connectivity.",
                critical: false,
              },
              {
                id: "tt-comm-6",
                label:
                  "Download offline maps for your campus area and Port of Spain in the Beacon app.",
                critical: false,
              },
              {
                id: "tt-comm-7",
                label:
                  "Share your Beacon profile link with at least one family member at home.",
                critical: false,
              },
              {
                id: "tt-comm-8",
                label:
                  "Ensure your phone plan includes local data. Recommended: Digicel or bMobile prepaid SIM with data bundle.",
                critical: true,
              },
            ],
          },
        },
      ],
    },
  });

  // =====================================================================
  // 3. COORDINATORS
  // =====================================================================

  console.log("  Inserting coordinators …");

  const passwordHash = await hashPassword("beacon2024");
  const passwordHash2 = await hashPassword("beacon2024");
  const passwordHash3 = await hashPassword("beacon2024");

  await db.insert(coordinators).values([
    {
      name: "OECS Regional Coordinator",
      email: "admin@beacon.oecs.org",
      passwordHash: passwordHash,
      role: "admin",
      oecsState: null,
    },
    {
      name: "Saint Lucia Desk Officer",
      email: "stlucia@beacon.oecs.org",
      passwordHash: passwordHash2,
      role: "coordinator",
      oecsState: "LC",
    },
    {
      name: "CDEMA Liaison",
      email: "cdema@beacon.oecs.org",
      passwordHash: passwordHash3,
      role: "observer",
      oecsState: null,
    },
  ]);

  // =====================================================================
  // 4. STUDENTS
  // =====================================================================

  console.log("  Inserting students …");

  const insertedStudents = await db
    .insert(students)
    .values([
      {
        fullName: "Kira Antoine",
        nationality: "Saint Lucian",
        oecsState: "LC",
        passportNumberEncrypted: "enc:LC:XXXX4291:salt_a1b2c3d4",
        programme: "Medicine",
        hostInstitution: "University of Havana",
        hostCountry: "CU",
        address:
          "Residencia Estudiantil, Calle L esq. 25, Vedado, Havana, Cuba",
        phone: "+53 5 812 3456",
        bloodType: "O+",
        medicalConditions: null,
        readinessScore: 85,
        walkthroughCompleted: true,
      },
      {
        fullName: "Marcus Joseph",
        nationality: "Dominican",
        oecsState: "DM",
        passportNumberEncrypted: "enc:DM:XXXX7823:salt_e5f6g7h8",
        programme: "Engineering",
        hostInstitution: "UTech Jamaica",
        hostCountry: "JM",
        address: "Block C, UTech Halls of Residence, 237 Old Hope Road, Kingston 6, Jamaica",
        phone: "+1 876 555 0147",
        bloodType: "A+",
        medicalConditions: "Mild asthma — carries inhaler",
        readinessScore: 72,
        walkthroughCompleted: true,
      },
      {
        fullName: "Shania Williams",
        nationality: "Grenadian",
        oecsState: "GD",
        passportNumberEncrypted: "enc:GD:XXXX3156:salt_i9j0k1l2",
        programme: "Law",
        hostInstitution: "UWI St. Augustine",
        hostCountry: "TT",
        address:
          "Canada Hall, UWI St. Augustine Campus, St. Augustine, Trinidad",
        phone: "+1 868 555 0283",
        bloodType: "B+",
        medicalConditions: null,
        readinessScore: 91,
        walkthroughCompleted: true,
      },
      {
        fullName: "Devon Charles",
        nationality: "Vincentian",
        oecsState: "VC",
        passportNumberEncrypted: "enc:VC:XXXX5489:salt_m3n4o5p6",
        programme: "Information Technology",
        hostInstitution: "Universidad de las Ciencias Informáticas (UCI)",
        hostCountry: "CU",
        address:
          "Residencia UCI, Carretera a San Antonio de los Baños, Km 2½, Havana, Cuba",
        phone: "+53 5 943 7812",
        bloodType: "AB+",
        medicalConditions: null,
        readinessScore: 60,
        walkthroughCompleted: false,
      },
      {
        fullName: "Aaliyah Baptiste",
        nationality: "Antiguan",
        oecsState: "AG",
        passportNumberEncrypted: "enc:AG:XXXX8912:salt_q7r8s9t0",
        programme: "Nursing",
        hostInstitution: "UWI Mona",
        hostCountry: "JM",
        address:
          "Irvine Hall, UWI Mona Campus, Kingston 7, Jamaica",
        phone: "+1 876 555 0391",
        bloodType: "O-",
        medicalConditions: "Allergic to penicillin",
        readinessScore: 78,
        walkthroughCompleted: true,
      },
    ])
    .returning({ id: students.id, fullName: students.fullName });

  // Build a look-up map: name → id
  const studentMap = new Map(
    insertedStudents.map((s) => [s.fullName, s.id]),
  );

  // =====================================================================
  // 5. EMERGENCY CONTACTS
  // =====================================================================

  console.log("  Inserting emergency contacts …");

  await db.insert(emergencyContacts).values([
    // ── Kira Antoine (Cuba) ──
    {
      studentId: studentMap.get("Kira Antoine")!,
      name: "Marie-Claire Antoine",
      relationship: "Mother",
      phone: "+1 758 452 3891",
      email: "mcantoine@gmail.com",
      isInCountry: false,
    },
    {
      studentId: studentMap.get("Kira Antoine")!,
      name: "Dr. Carlos Reyes",
      relationship: "University Advisor",
      phone: "+53 7 878 4502",
      email: "c.reyes@uh.cu",
      isInCountry: true,
    },

    // ── Marcus Joseph (Jamaica) ──
    {
      studentId: studentMap.get("Marcus Joseph")!,
      name: "Gloria Joseph",
      relationship: "Mother",
      phone: "+1 767 448 2156",
      email: "gloriaj@cwdom.dm",
      isInCountry: false,
    },
    {
      studentId: studentMap.get("Marcus Joseph")!,
      name: "Prof. Andrew Campbell",
      relationship: "Faculty Advisor",
      phone: "+1 876 927 1680",
      email: "a.campbell@utech.edu.jm",
      isInCountry: true,
    },

    // ── Shania Williams (Trinidad) ──
    {
      studentId: studentMap.get("Shania Williams")!,
      name: "David Williams",
      relationship: "Father",
      phone: "+1 473 435 7289",
      email: "d.williams@spiceisle.com",
      isInCountry: false,
    },
    {
      studentId: studentMap.get("Shania Williams")!,
      name: "Natasha Rampersad",
      relationship: "Roommate / Emergency Buddy",
      phone: "+1 868 732 4418",
      email: "n.rampersad@sta.uwi.edu",
      isInCountry: true,
    },

    // ── Devon Charles (Cuba) ──
    {
      studentId: studentMap.get("Devon Charles")!,
      name: "Patricia Charles",
      relationship: "Mother",
      phone: "+1 784 457 1834",
      email: "pcharles@vincysurf.com",
      isInCountry: false,
    },
    {
      studentId: studentMap.get("Devon Charles")!,
      name: "Miguel Fernández",
      relationship: "Programme Coordinator at UCI",
      phone: "+53 7 837 2600",
      email: "m.fernandez@uci.cu",
      isInCountry: true,
    },

    // ── Aaliyah Baptiste (Jamaica) ──
    {
      studentId: studentMap.get("Aaliyah Baptiste")!,
      name: "Cheryl Baptiste",
      relationship: "Mother",
      phone: "+1 268 462 0573",
      email: "c.baptiste@apua.ag",
      isInCountry: false,
    },
    {
      studentId: studentMap.get("Aaliyah Baptiste")!,
      name: "Nurse Sandra Morrison",
      relationship: "Clinical Supervisor",
      phone: "+1 876 927 1620",
      email: "s.morrison@uhwi.gov.jm",
      isInCountry: true,
    },
  ]);

  console.log("\n✅ Seed complete!\n");
  console.log("  Countries:           3  (CU, JM, TT)");
  console.log("  Emergency Protocols: 3  (one per country)");
  console.log("  Coordinators:        3  (admin, coordinator, observer)");
  console.log("  Students:            5");
  console.log("  Emergency Contacts: 10  (2 per student)\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
