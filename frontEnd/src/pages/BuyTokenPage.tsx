import { BuyTokensSection } from "../components/BuyTokensSection";
import { HeroStats } from "../components/HeroStats";
export function BuyTokenPage() {
  return (
    <div className="w-full space-y-8 animate-fade-in">
      <HeroStats />
      <BuyTokensSection />
    </div>
  );
}
