type FeatureImage = string | { src: string };

interface FeatureCardProps {
  image: FeatureImage;
  title: string;
  description: string;
}

const FeatureCard = ({ image, title, description }: FeatureCardProps) => {
  const imageSrc = typeof image === "string" ? image : image.src;

  return (
    <div className="feature-card bg-card border border-border group cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all duration-300">
      <div className="aspect-square overflow-hidden rounded-t-2xl">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-5 bg-card rounded-b-2xl">
        <h3 className="font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
