export type ElectricityPlanInfo = {
  provider: string;
  plan: string;
  headline: string;
  supplyArea: string;
  estimatedAnnualCost: string;
  usageRate: string;
  solarFeedInTariff: string;
  billingNote: string;
  features: string[];
  sourceNote: string;
};

const samplePlans: ElectricityPlanInfo[] = [
  {
    provider: 'EnergyAustralia',
    plan: 'Flexi Plan',
    headline: 'Variable market offer with flexible billing and no lock-in contract.',
    supplyArea: 'Wollongong / Ausgrid network',
    estimatedAnnualCost: '$1,670 for a typical 3,900 kWh household',
    usageRate: 'Around 35c/kWh standard grid rate used for FairShare estimates',
    solarFeedInTariff: 'Standard feed-in tariff varies by retailer and export conditions',
    billingNote: 'FairShare savings are shown as estimated bill credits until confirmed by the retailer.',
    features: ['No lock-in contract', 'Variable usage rates', 'Retailer applies local energy credits to your bill'],
    sourceNote: 'Sample plan document for development. Replace with verified retailer plan data before production.',
  },
  {
    provider: 'EnergyAustralia',
    plan: 'Solar Max',
    headline: 'Solar-focused market offer with a higher feed-in tariff for eligible exports.',
    supplyArea: 'Wollongong / Ausgrid network',
    estimatedAnnualCost: '$1,899 for a typical 3,900 kWh household',
    usageRate: 'Around 35c/kWh standard grid rate used for FairShare estimates',
    solarFeedInTariff: 'Higher feed-in tariff may apply to eligible solar exports',
    billingNote: 'Buyer savings depend on matched local energy and the participating retailer credit rules.',
    features: ['Higher solar feed-in focus', 'No lock-in contract', 'Best suited to solar-owner households'],
    sourceNote: 'Sample plan document for development. Replace with verified retailer plan data before production.',
  },
  {
    provider: 'Origin Energy',
    plan: 'Rate Fix',
    headline: 'Fixed-rate style market offer for households that prefer price certainty.',
    supplyArea: 'Wollongong / Ausgrid network',
    estimatedAnnualCost: '$1,785 for a typical 3,900 kWh household',
    usageRate: 'Around 35c/kWh standard grid rate used for FairShare estimates',
    solarFeedInTariff: 'Feed-in tariff depends on the active retailer agreement',
    billingNote: 'Local energy credits are estimates until they appear on the electricity bill.',
    features: ['Price certainty period', 'Retailer-managed billing', 'Compatible with local energy matching'],
    sourceNote: 'Sample plan document for development. Replace with verified retailer plan data before production.',
  },
];

export function getElectricityPlanInfo(provider?: string | null, plan?: string | null): ElectricityPlanInfo {
  const normalizedProvider = normalize(provider);
  const normalizedPlan = normalize(plan);

  return (
    samplePlans.find(
      (entry) => normalize(entry.provider) === normalizedProvider && normalize(entry.plan) === normalizedPlan,
    ) ??
    samplePlans.find((entry) => normalize(entry.plan) === normalizedPlan) ??
    {
      provider: provider?.trim() || 'Your electricity provider',
      plan: plan?.trim() || 'Current electricity plan',
      headline: 'Plan details are saved from your FairShare account profile.',
      supplyArea: 'Wollongong / Ausgrid network',
      estimatedAnnualCost: 'Not available in the sample plan library',
      usageRate: 'FairShare currently estimates the standard grid rate at 35c/kWh',
      solarFeedInTariff: 'Feed-in tariff depends on the chosen retailer and plan',
      billingNote: 'Your retailer applies confirmed local energy credits to your normal electricity bill.',
      features: ['Provider and plan are stored in your account', 'FairShare estimates are based on matched local energy'],
      sourceNote: 'No matching sample document found yet. Add this retailer plan to the local plan library.',
    }
  );
}

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}
