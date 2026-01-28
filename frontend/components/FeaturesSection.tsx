import FeatureCard from "./FeatureCard";
import featureUpload from "../assets/feature-upload.png";
import featureAi from "../assets/feature-ai.png";
import featureCustomize from "../assets/feature-customize.png";
import featureExport from "../assets/feature-export.png";

const features = [
  {
    image: featureUpload,
    title: "Upload Your Video",
    description: "Simply drag and drop any video file to get started instantly.",
  },
  {
    image: featureAi,
    title: "AI-Powered Transcription",
    description: "Smart Hinglish recognition for perfect mixed-language captions.",
  },
  {
    image: featureCustomize,
    title: "Customize Styles",
    description: "Choose fonts, colors, and positions to match your brand.",
  },
  {
    image: featureExport,
    title: "Export Anywhere",
    description: "Download SRT files or get videos with burned-in subtitles.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/20 to-transparent pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            From upload to export, we've got your caption workflow covered
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
