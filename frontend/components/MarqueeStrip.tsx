import { Star } from "lucide-react";

const features = [
  "Auto Hinglish Captions",
  "Custom Fonts",
  "Export SRT",
  "Burned-in Subtitles",
  "AI-Powered",
  "Quick Turnaround",
  "Multiple Styles",
  "Easy to Use",
];

const MarqueeStrip = () => {
  return (
    <div className="w-full overflow-hidden bg-foreground py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...features, ...features].map((feature, index) => (
          <div key={index} className="flex items-center mx-6">
            <Star className="w-4 h-4 text-primary mr-2 fill-primary" />
            <span className="text-sm font-medium text-background">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueeStrip;
