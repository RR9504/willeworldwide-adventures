import { describe, it, expect } from "vitest";
import { calcExtraCostsFromFormData, calcMinRequiredExtraSek } from "@/lib/messaging";
import { FormField } from "@/types/trip";

const hotelField: FormField = {
  id: "hotel",
  type: "select",
  label: "Hotell",
  required: true,
  options: [
    { label: "Hotell Cavalletto", value: "Hotell Cavalletto", priceModifier: 12200, priceModifierCurrency: "SEK" },
    { label: "Val de Costa", value: "Val de Costa", priceModifier: 12800, priceModifierCurrency: "SEK" },
  ],
};

const optionalExtra: FormField = {
  id: "transfer",
  type: "checkbox",
  label: "Flygtransfer",
  required: false,
  priceModifier: 500,
  priceModifierCurrency: "SEK",
};

describe("pricing", () => {
  it("includes the selected hotel price in the extra costs", () => {
    const extra = calcExtraCostsFromFormData([hotelField], { Hotell: "Val de Costa" });
    expect(extra["SEK"]).toBe(12800);
  });

  it("adds an opted-in checkbox surcharge on top", () => {
    const extra = calcExtraCostsFromFormData([hotelField, optionalExtra], {
      Hotell: "Hotell Cavalletto",
      Flygtransfer: true,
    });
    expect(extra["SEK"]).toBe(12700); // 12200 + 500
  });

  it("uses the cheapest required option for 'Pris från'", () => {
    expect(calcMinRequiredExtraSek([hotelField])).toBe(12200);
  });

  it("ignores optional checkboxes in the 'from' price", () => {
    expect(calcMinRequiredExtraSek([hotelField, optionalExtra])).toBe(12200);
  });
});
