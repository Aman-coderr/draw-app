import { Pencil, Zap, Users, Sparkles } from 'lucide-react';

interface FeaturesProps {
  isVisible: boolean;
}

export default function Features({ isVisible }: FeaturesProps) {
  const features = [
    {
      icon: Pencil,
      title: 'Intuitive Drawing',
      description: 'Create diagrams, wireframes, and sketches with an easy-to-use interface'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed with instant rendering and smooth performance'
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time, anywhere in the world'
    },
    {
      icon: Sparkles,
      title: 'Export Anywhere',
      description: 'Export your creations as PNG, SVG, or share with a link'
    }
  ];

  return (
    <div
      className={`mt-32 transition-all duration-1000 delay-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-slate-800 mb-4">
          Everything you need to create
        </h2>
        <p className="text-lg text-slate-600">
          Powerful features wrapped in a beautiful, intuitive interface
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-slate-100"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

