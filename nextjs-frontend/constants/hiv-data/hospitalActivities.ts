import { ActivityCategoryType } from '../../features/planning/schema/hiv/schemas';

// Categories and their activities for Hospitals
export const HOSPITAL_ACTIVITIES: ActivityCategoryType = {
  "Human Resources (HR)": [
    {
      activity: "Provide salaries for health facilities staff (DHs, HCs)",
      typeOfActivity: "Salary"
    },
    {
      activity: "Provide bonus for 2023-24",
      typeOfActivity: "Bonus"
    },
    {
      activity: "Provide performance bonuses for hospital staff",
      typeOfActivity: "Bonus"
    },
  ],
  "Travel Related Costs (TRC)": [
    {
      activity: "Conduct outreach to provide HIV testing service in communities",
      typeOfActivity: "Campaign for HIV testing"
    },
    {
      activity: "Conduct outreach VMMC provision at decentralized level",
      typeOfActivity: "Campaign"
    },
    {
      activity: "Conduct district events related to WAD celebration",
      typeOfActivity: "Campaign"
    },
    {
      activity: "Conduct training of Peer educators for Negative partner of Sero-Discordant couples on HIV and AIDS and sexual health issues",
      typeOfActivity: "Training"
    },
    {
      activity: "Conduct integrated clinical mentorship  from District Hospital to Health centres  to support Treat All and DSDM implementation",
      typeOfActivity: "Supervision"
    },
    {
      activity: "Conduct annual coordination meeting at district level",
      typeOfActivity: "Workshop"
    },
    {
      activity: "Conduct quarterly multidisciplinary team meeting (MDT). Participants are those not supported by other donor",
      typeOfActivity: "Workshop"
    },
    {
      activity: "Conduct quarterly multidisciplinary team meeting (MDT)",
      typeOfActivity: "Workshop"
    },
    {
      activity: "Conduct support group meeting at Health Facilities especially for adolescents and children and younger adults",
      typeOfActivity: "meeting"
    },
    {
      activity: "Conduct home visit for lost to follow up",
      typeOfActivity: "supervision"
    },
    {
      activity: "Conduct supervision and DQA from District Hospitals to Health Centers",
      typeOfActivity: "Supervision"
    },
    {
      activity: "Conduct sample transportation from  District Hospitals to Referal hospitals/NRL",
      typeOfActivity: "Transport"
    }
  ],
  "Health Products & Equipment (HPE)": [
    {
      activity: "Support to DHs and HCs to improve and maintain infrastructure standards- Motor car Vehicles",
      typeOfActivity: "Maintenance"
    },
  ],
  "Program Administration Costs (PA)": [
    {
      activity: "National and sub-HIV databases",
      typeOfActivity: "Utilities"
    },
    {
      activity: "Infrastructure and Equipment",
      typeOfActivity: "Communication"
    }
  ],
}; 