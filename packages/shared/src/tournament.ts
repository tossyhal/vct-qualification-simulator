import type { Team } from "./types";

export const EVENT_ID = "vct-2026-pacific-stage-2";
export const EVENT_NAME = "VCT 2026 Pacific Stage 2";
export const LIQUIPEDIA_PAGE = "VCT/2026/Pacific_League/Stage_2/Group_Stage";
export const LIQUIPEDIA_SOURCE_URL =
  "https://liquipedia.net/valorant/VCT/2026/Pacific_League/Stage_2/Group_Stage";

const logo = (path: string) => `https://liquipedia.net${path}`;

export const TEAMS: Team[] = [
  ["full-sense", "FULL SENSE", "FS", "Thailand", "alpha", "/commons/images/thumb/f/f1/FULL_SENSE_2025_allmode.png/59px-FULL_SENSE_2025_allmode.png"],
  ["global-esports", "Global Esports", "GE", "India", "alpha", "/commons/images/thumb/2/23/Global_Esports_2020_allmode.png/84px-Global_Esports_2020_allmode.png"],
  ["rex-regum-qeon", "Rex Regum Qeon", "RRQ", "Indonesia", "alpha", "/commons/images/thumb/1/1e/Rex_Regum_Qeon_allmode.png/70px-Rex_Regum_Qeon_allmode.png"],
  ["nongshim-redforce", "Nongshim RedForce", "NS", "South Korea", "alpha", "/commons/images/thumb/d/d8/NS_Redforce_allmode.png/37px-NS_Redforce_allmode.png"],
  ["zeta-division", "ZETA DIVISION", "ZETA", "Japan", "alpha", "/commons/images/thumb/4/4f/ZETA_DIVISION_lightmode.png/50px-ZETA_DIVISION_lightmode.png"],
  ["gen-g", "Gen.G", "GEN", "South Korea", "alpha", "/commons/images/thumb/0/07/Gen.G_Esports_2026_allmode.png/58px-Gen.G_Esports_2026_allmode.png"],
  ["paper-rex", "Paper Rex", "PRX", "Singapore", "omega", "/commons/images/thumb/8/8c/Paper_Rex_lightmode.png/59px-Paper_Rex_lightmode.png"],
  ["t1", "T1", "T1", "South Korea", "omega", "/commons/images/thumb/e/e4/T1_2019_allmode.png/100px-T1_2019_allmode.png"],
  ["kiwoom-drx", "KIWOOM DRX", "KRX", "South Korea", "omega", "/commons/images/thumb/0/0c/DRX_2026_lightmode.png/50px-DRX_2026_lightmode.png"],
  ["detonation-focusme", "DetonatioN FocusMe", "DFM", "Japan", "omega", "/commons/images/thumb/2/27/DetonatioN_FocusMe_2022_lightmode.png/65px-DetonatioN_FocusMe_2022_lightmode.png"],
  ["team-secret", "Team Secret", "TS", "Philippines", "omega", "/commons/images/thumb/0/07/Team_Secret_lightmode.png/100px-Team_Secret_lightmode.png"],
  ["varrel", "VARREL", "VL", "Japan", "omega", "/commons/images/thumb/8/85/VARREL_lightmode.png/61px-VARREL_lightmode.png"]
].map(([id, name, shortName, country, group, logoPath]) => ({
  id: id!,
  name: name!,
  shortName: shortName!,
  country: country!,
  group: group as Team["group"],
  logoUrl: logo(logoPath!)
}));

export const TEAM_NAME_TO_ID = new Map<string, string>([
  ...TEAMS.flatMap((team) => [
    [team.name.toLowerCase(), team.id] as const,
    [team.shortName.toLowerCase(), team.id] as const
  ]),
  ["gen.g esports", "gen-g"],
  ["drx", "kiwoom-drx"]
]);
