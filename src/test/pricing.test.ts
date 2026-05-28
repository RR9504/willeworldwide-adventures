import { describe, it, expect } from "vitest";
import { calcExtraCostsFromFormData, calcMinRequiredExtraSek, collectTbdLabels, buildRegistrationEmail } from "@/lib/messaging";
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

describe("price tbd (meddelas senare)", () => {
  const roomField: FormField = {
    id: "room",
    type: "select",
    label: "Rumstyp",
    required: true,
    options: [
      { label: "Dubbelrum", value: "double", priceModifier: 0, priceModifierCurrency: "SEK" },
      { label: "Enkelrum", value: "single", priceTbd: true },
    ],
  };

  const liftCard: FormField = {
    id: "lift",
    type: "checkbox",
    label: "Liftkort",
    required: false,
    priceTbd: true,
  };

  it("does not add tbd option to the total", () => {
    const extra = calcExtraCostsFromFormData([roomField], { Rumstyp: "single" });
    expect(extra["SEK"] || 0).toBe(0);
  });

  it("does not add a tbd checkbox to the total even if ticked", () => {
    const extra = calcExtraCostsFromFormData([liftCard], { Liftkort: true });
    expect(extra["SEK"] || 0).toBe(0);
  });

  it("collects field labels for selected tbd options", () => {
    const labels = collectTbdLabels([roomField, liftCard], { Rumstyp: "single", Liftkort: true });
    expect(labels).toEqual(["Rumstyp", "Liftkort"]);
  });

  it("ignores tbd options when computing 'Pris från'", () => {
    // Only the priced option (double=0) counts → min surcharge = 0.
    expect(calcMinRequiredExtraSek([roomField])).toBe(0);
  });

  it("mentions tbd labels in the registration email", () => {
    const { message } = buildRegistrationEmail({
      firstName: "Anna",
      tripTitle: "Test",
      totalPrice: 1000,
      tbdLabels: ["Rumstyp", "Liftkort"],
    });
    expect(message).toContain("Rumstyp, Liftkort");
    expect(message).toContain("meddelas senare");
  });
});
