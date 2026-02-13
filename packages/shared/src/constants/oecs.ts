export interface OECSMemberState {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  callingCode: string;
}

export const OECS_MEMBER_STATES: OECSMemberState[] = [
  { name: "Antigua and Barbuda", code: "AG", callingCode: "+1268" },
  { name: "Commonwealth of Dominica", code: "DM", callingCode: "+1767" },
  { name: "Grenada", code: "GD", callingCode: "+1473" },
  { name: "Montserrat", code: "MS", callingCode: "+1664" },
  { name: "Saint Kitts and Nevis", code: "KN", callingCode: "+1869" },
  { name: "Saint Lucia", code: "LC", callingCode: "+1758" },
  { name: "Saint Vincent and the Grenadines", code: "VC", callingCode: "+1784" },
];

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "kwé", name: "Kwéyòl", native: "Kwéyòl" },
] as const;
