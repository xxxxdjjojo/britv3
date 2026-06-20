/**
 * Unit tests for the EPC certificate CSV parser.
 *
 * The downloaded EPC domestic dataset is quoted CSV with a 93-column header
 * (the per-year `certificates-YYYY.csv` files). Parsing is header-name-indexed
 * (column order is NOT stable across years), and blank / "NO DATA!" /
 * "INVALID!" / "N/A" sentinels collapse to null.
 */
import { describe, it, expect } from "vitest";
import { parseEpcHeader, parseEpcRow } from "./parse-epc-row";

// A real header line from certificates-2026.csv (column order matters: parsing
// must resolve by name, so the test proves name-indexing — not position).
const HEADER =
  "certificate_number,address1,address2,address3,postcode,posttown,address,constituency,constituency_label,local_authority,local_authority_label,built_form,co2_emiss_curr_per_floor_area,co2_emissions_current,co2_emissions_potential,construction_age_band,current_energy_efficiency,current_energy_rating,energy_consumption_current,energy_consumption_potential,energy_tariff,environment_impact_current,environment_impact_potential,extension_count,fixed_lighting_outlets_count,flat_storey_count,flat_top_storey,floor_description,floor_energy_eff,floor_height,floor_level,glazed_area,glazed_type,heat_loss_corridor,heating_cost_current,heating_cost_potential,hot_water_cost_current,hot_water_cost_potential,hot_water_energy_eff,hot_water_env_eff,hotwater_description,inspection_date,lighting_cost_current,lighting_cost_potential,lighting_description,lighting_energy_eff,lighting_env_eff,lodgement_date,lodgement_datetime,low_energy_lighting,low_energy_fixed_lighting_outlets_count,main_fuel,mainheat_description,mainheat_energy_eff,mainheat_env_eff,mainheatc_energy_eff,mainheatc_env_eff,mainheatcont_description,main_heating_controls,mains_gas_flag,mechanical_ventilation,multi_glaze_proportion,number_habitable_rooms,number_heated_rooms,number_open_fireplaces,photo_supply,potential_energy_efficiency,potential_energy_rating,property_type,report_type,roof_description,roof_energy_eff,roof_env_eff,secondheat_description,sheating_energy_eff,sheating_env_eff,solar_water_heating_flag,tenure,total_floor_area,transaction_type,unheated_corridor_length,walls_description,walls_energy_eff,walls_env_eff,wind_turbine_count,windows_description,windows_energy_eff,windows_env_eff,floor_env_eff,region,country,uprn,uprn_source";

// A real data row (note quoted fields containing commas).
const ROW =
  '0151-3058-8202-6036-8204,1 Stafford Court,Kingscroft Road,,SM7 3NE,BANSTEAD,"1 Stafford Court, Kingscroft Road",E14001442,Reigate,E07000211,Reigate and Banstead,Not Recorded,49,2.9,1.9,England and Wales: 1950-1966,64,D,231,156,Single,57,71,0,10,1,N,"Solid, no insulation (assumed)",N/A,2.44,1,,,no corridor,764,500,168,169,Good,Good,From main system,2026-02-05,44,44,Good lighting efficiency,Good,Good,2026-02-06,2026-02-06 16:57:00,100,10,mains gas (not community),"Boiler and radiators, mains gas",Good,Good,Good,Good,"Programmer, room thermostat and TRVs","Programmer, room thermostat and TRVs",Y,natural,100,3,3,1,0,73,C,Flat,2,(another dwelling above),N/A,N/A,"Room heaters, coal",N/A,N/A,N,owner-occupied,60,Marketed sale,,"Solid brick, as built, no insulation (assumed)",Very Poor,Very Poor,0,Fully double glazed,Poor,Poor,N/A,E12000008,England,68132136,Energy Assessor';

const header = parseEpcHeader(HEADER);

describe("parseEpcRow", () => {
  it("parses a real certificate row into typed fields", () => {
    const cert = parseEpcRow(ROW, header);
    expect(cert).not.toBeNull();
    expect(cert).toMatchObject({
      certificateNumber: "0151-3058-8202-6036-8204",
      uprn: "68132136",
      postcode: "SM7 3NE",
      address1: "1 Stafford Court",
      address2: "Kingscroft Road",
      currentEnergyRating: "D",
      currentEnergyEfficiency: 64,
      potentialEnergyRating: "C",
      potentialEnergyEfficiency: 73,
      propertyType: "Flat",
      builtForm: null, // "Not Recorded" is a no-data sentinel
      totalFloorArea: 60,
      constructionAgeBand: "England and Wales: 1950-1966",
      tenure: "owner-occupied",
      localAuthority: "E07000211",
      inspectionDate: "2026-02-05",
    });
  });

  it("extracts paon as the leading house number of address1", () => {
    const cert = parseEpcRow(ROW, header);
    expect(cert?.paon).toBe("1");
  });

  it("collapses blank / NO DATA! / INVALID! / N/A to null", () => {
    // address1 numeric token absent, ratings sentinels, floor area blank.
    const fields = HEADER.split(",").map((name) => {
      if (name === "certificate_number") return "9999-0000-0000-0000-0000";
      if (name === "current_energy_rating") return "INVALID!";
      if (name === "potential_energy_rating") return "NO DATA!";
      if (name === "total_floor_area") return "";
      if (name === "uprn") return "NO DATA!";
      if (name === "inspection_date") return "NO DATA!";
      if (name === "address1") return "Rose Cottage";
      return "x";
    });
    const cert = parseEpcRow(fields.join(","), header);
    expect(cert).not.toBeNull();
    expect(cert?.currentEnergyRating).toBeNull();
    expect(cert?.potentialEnergyRating).toBeNull();
    expect(cert?.totalFloorArea).toBeNull();
    expect(cert?.uprn).toBeNull();
    expect(cert?.inspectionDate).toBeNull();
    // Non-numeric address1 → whole string is the paon.
    expect(cert?.paon).toBe("Rose Cottage");
  });

  it("returns null when certificate_number is missing", () => {
    const fields = HEADER.split(",").map((name) =>
      name === "certificate_number" ? "" : "x",
    );
    expect(parseEpcRow(fields.join(","), header)).toBeNull();
  });

  it("returns null for a row with the wrong column count", () => {
    expect(parseEpcRow("only,three,columns", header)).toBeNull();
  });
});
