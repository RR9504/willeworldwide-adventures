import { describe, it, expect } from "vitest";
import { calcExtraCostsFromFormData, calcMinRequiredExtraSek, collectTbdLabels, buildRegistrationEmail, formatAnswersForEmail, formatPresentationForEmail } from "@/lib/messaging";
import { FormField, PresentationQuestion } from "@/types/trip";

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

describe("email answer summary", () => {
  const fields: FormField[] = [
    { id: "f1", type: "text", label: "Förnamn", required: true },
    { id: "f2", type: "email", label: "E-post", required: true },
    { id: "f3", type: "select", label: "Hotell", required: true, options: [
      { label: "Hotell Cavalletto", value: "hotell-cavalletto" },
      { label: "Val de Costa", value: "val-de-costa" },
    ]},
    { id: "f4", type: "checkbox", label: "Liftkort", required: false },
    { id: "f5", type: "text", label: "Övrigt", required: false },
  ];

  it("formats answered fields with select label resolved", () => {
    const lines = formatAnswersForEmail(fields, {
      "Förnamn": "Anna",
      "E-post": "anna@example.com",
      "Hotell": "val-de-costa",
      "Liftkort": true,
      "Övrigt": "",
    });
    expect(lines).toEqual([
      "• Förnamn: Anna",
      "• E-post: anna@example.com",
      "• Hotell: Val de Costa",
      "• Liftkort: Ja",
    ]);
  });

  it("skips unticked checkboxes", () => {
    const lines = formatAnswersForEmail(fields, { "Liftkort": false });
    expect(lines).toEqual([]);
  });

  it("formats presentation questions with answers", () => {
    const pf: PresentationQuestion[] = [
      { id: "pq-1", type: "textarea", question: "Berätta om dig" },
      { id: "pq-2", type: "text", question: "Varifrån?" },
    ];
    const lines = formatPresentationForEmail(pf, { "pq-1": "Jag heter Anna", "pq-2": "Stockholm" });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Berätta om dig");
    expect(lines[0]).toContain("Jag heter Anna");
  });

  it("includes the answer summary in the registration email", () => {
    const { message } = buildRegistrationEmail({
      firstName: "Anna",
      tripTitle: "Skidresa",
      formFields: fields,
      formData: { "Förnamn": "Anna", "Hotell": "val-de-costa" },
      presentationFields: [{ id: "pq-1", type: "text", question: "Varifrån?" }],
      presentationData: { "pq-1": "Stockholm" },
    });
    expect(message).toContain("--- Dina svar ---");
    expect(message).toContain("Hotell: Val de Costa");
    expect(message).toContain("--- Lära känna ---");
    expect(message).toContain("Stockholm");
  });
});
