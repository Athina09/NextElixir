import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { CampaignPerformanceTable } from "@/components/CampaignPerformanceTable";
import { CampaignTypeTable } from "@/components/CampaignTypeTable";
import { ChannelPerformanceTable } from "@/components/ChannelPerformanceTable";

export const Route = createFileRoute("/campaign-analytics")({
  head: () => ({
    meta: [
      { title: "Campaign Analytics · ForecastIQ" },
      { name: "description", content: "Efficiency and confidence signals across every campaign and channel." },
    ],
  }),
  component: () => (
    <PageContainer
      title="Campaign Analytics"
      description="Efficiency, confidence, and forecast contribution across every campaign, campaign type, and channel."
    >
      <div className="grid gap-3">
        <ChannelPerformanceTable />
        <CampaignTypeTable />
        <CampaignPerformanceTable />
      </div>
    </PageContainer>
  ),
});
