import { Check, ArrowRight } from 'lucide-react';

interface BenefitsSectionProps {
  isVisible: boolean;
}

export default function BenefitsSection({ isVisible }: BenefitsSectionProps) {
  const benefits = [
    'Unlimited canvas size',
    'Hand-drawn style',
    'Library of shapes',
    'Dark mode support',
    'Keyboard shortcuts',
    'No sign-up required'
  ];

  return (
    <div
      className={`mt-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 shadow-2xl transition-all duration-1000 delay-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Why teams choose Excelidraw
        </h2>
        <p className="text-xl text-blue-100 mb-12">
          Join thousands of teams already creating amazing work
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-white font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        <button className="mt-12 px-10 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto">
          Get Started for Free
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

